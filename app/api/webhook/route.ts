import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { isDbConfigured } from "@/lib/db";
import { isCellgodsConfigured, CellgodsError } from "@/lib/cellgods";
import { alreadyProcessed, markEventProcessed } from "@/lib/subscriptions";
import {
  markPaid,
  beginActivation,
  markActivationFailedTransient,
  markActivationPendingCredit,
  markRefunded,
} from "@/lib/rentals";
import { activateRental } from "@/lib/activation";

/**
 * AMERICELL Stripe webhook — exactly-once rental activation (RESELLER_PLAN §5.5C, §7.2).
 *
 * Keeps the raw-body signature verification and event-id dedup from the original
 * handler. Stripe delivers at-least-once, so activation is guarded by three
 * layers: event-id dedup (`webhook_events`), the `stripe_session_id` UNIQUE row,
 * and the `beginActivation` compare-and-swap gate (`paid → activating`). Only the
 * first delivery per session wins the CAS and calls CellGods.
 */
export async function POST(req: Request) {
  // External calls + DB access must be configured; return 503 so Stripe retries later.
  if (!isStripeConfigured || !stripe) {
    return Response.json({ error: "Stripe not configured." }, { status: 503 });
  }
  if (!isDbConfigured) {
    return Response.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isCellgodsConfigured) {
    return Response.json({ error: "CellGods not configured." }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook secret not set." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return Response.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // Raw body is required for signature verification.
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, sig, secret);
  } catch (err) {
    return Response.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  // Idempotency (layer 1): ignore an event id we've already handled.
  if (await alreadyProcessed(event.id)) {
    return Response.json({ received: true, duplicate: true });
  }

  // A rental is fulfilled on the synchronous `completed` event, or on
  // `async_payment_succeeded` for delayed-capture payment methods.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    // Never activate before payment is actually captured (§7.3).
    if (session.payment_status !== "paid") {
      return Response.json({ received: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      // A paid `mode:"payment"` session always carries a PaymentIntent; its
      // absence is a Stripe anomaly we can neither record nor later refund
      // against. Alert and let the shared tail mark the event processed.
      console.error(
        `[ALERT] paid checkout session missing payment_intent session=${session.id}`,
      );
    } else {
      // CAS: pending_payment → paid (idempotent; no-op on a duplicate delivery).
      await markPaid(session.id, paymentIntentId);

      // CAS gate (layer 3, the exactly-once claim): paid → activating. A
      // duplicate/already-claimed delivery gets `undefined` and falls through.
      const owned = await beginActivation(session.id);

      if (owned) {
        try {
          await activateRental(owned);
        } catch (err) {
          if (err instanceof CellgodsError) {
            const { status } = err;

            if (status === 429 || status === 500 || status === 0) {
              // Transient: reset activating → paid so a Stripe retry re-claims it
              // via the CAS gate (safe — no double-activate on this delivery).
              await markActivationFailedTransient(session.id, err.message);
              return Response.json(
                { error: "Activation failed transiently; Stripe will retry." },
                { status: 500 },
              );
            }

            if (status === 402) {
              // Insufficient reseller credit (§7.3): queue for credit + ops alert.
              // Definitively handled → fall through to markEventProcessed + 200.
              await markActivationPendingCredit(session.id, err.message);
              console.error(
                `[ALERT] insufficient CellGods credit — rental queued session=${session.id}: ${err.message}`,
              );
            } else {
              // Terminal (409/400/…): can never succeed. Refund on AMERICELL
              // Stripe ONLY (never CellGods /deactivate — no refund + phone lost)
              // and close the rental out.
              await stripe.refunds.create({ payment_intent: paymentIntentId });
              await markRefunded(session.id);
              console.error(
                `[ALERT] terminal activation failure — refunded session=${session.id} status=${status}: ${err.message}`,
              );
            }
          } else {
            // Non-CellGods throw: `activate()` SUCCEEDED but persistence/encryption
            // failed AFTER the claim. Phone is live and credit spent — do NOT
            // refund and do NOT blind-retry (§7.2.5). Leave the row `activating`
            // for the reconcile cron. Return 500; a retry no-ops via the CAS gate.
            console.error(
              `[ALERT] post-activation persistence failure — reconcile required session=${session.id}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
            return Response.json(
              { error: "Activation persisted partially; reconcile required." },
              { status: 500 },
            );
          }
        }
      }
    }
  }

  // Dropped the `customer.subscription.*` cases — dead code for one-off rentals.
  await markEventProcessed(event.id, event.type);

  return Response.json({ received: true });
}
