import { isDbConfigured } from "@/lib/db";
import { CellgodsError, isCellgodsConfigured } from "@/lib/cellgods";
import { alreadyProcessed, markEventProcessed } from "@/lib/subscriptions";
import {
  beginActivation,
  getRentalById,
  markActivationFailedTransient,
  markActivationPendingCredit,
  markPaid,
  markRefunded,
} from "@/lib/rentals";
import { activateRental } from "@/lib/activation";
import { logEvent } from "@/lib/logs";
import {
  isMoonpayConfigured,
  verifyMoonpayWebhook,
  type MoonpayWebhookEvent,
} from "@/lib/moonpay";

/**
 * MoonPay webhook — exactly-once crypto activation. Reuses the same three-layer
 * idempotency as the Stripe webhook: event-id dedup (webhook_events), the
 * rental's UNIQUE payment ref, and the `beginActivation` CAS gate. On a
 * `completed` transaction we map externalTransactionId → rental and activate.
 *
 * NOTE: crypto settlements are NOT auto-refundable (unlike Stripe). On a terminal
 * activation failure we mark the rental refunded in the DB and alert ops for a
 * manual crypto refund — we never call CellGods /deactivate to "refund".
 */
export async function POST(req: Request) {
  if (!isMoonpayConfigured) {
    return Response.json({ error: "MoonPay not configured." }, { status: 503 });
  }
  if (!isDbConfigured) {
    return Response.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isCellgodsConfigured) {
    return Response.json({ error: "CellGods not configured." }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("moonpay-signature-v2");
  if (!verifyMoonpayWebhook(raw, sig)) {
    return Response.json({ error: "Signature verification failed." }, { status: 400 });
  }

  let event: MoonpayWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const tx = event.data;
  const status = tx?.status;
  const externalId = tx?.externalTransactionId; // = rental.id
  const txId = tx?.id;

  // Only act on a settled transaction we can map back to a rental.
  if (status !== "completed" || !externalId || !txId) {
    return Response.json({ received: true });
  }

  const eventId = `moonpay:${txId}`;
  if (await alreadyProcessed(eventId)) {
    return Response.json({ received: true, duplicate: true });
  }

  const rental = await getRentalById(externalId);
  if (!rental) {
    console.warn(`[moonpay] no rental for externalTransactionId=${externalId}`);
    await markEventProcessed(eventId, "moonpay.completed");
    return Response.json({ received: true });
  }

  const sid = rental.stripeSessionId;
  await markPaid(sid, txId); // CAS pending_payment → paid
  const owned = await beginActivation(sid); // CAS paid → activating (exactly-once)

  if (owned) {
    try {
      await activateRental(owned);
      await logEvent({
        actorType: "system",
        action: "rental.activated",
        targetType: "rental",
        targetId: rental.id,
        metadata: { method: "moonpay", model: rental.model, retailCents: rental.retailCents },
      });
    } catch (err) {
      if (err instanceof CellgodsError) {
        const { status: st } = err;
        if (st === 429 || st === 500 || st === 0) {
          await markActivationFailedTransient(sid, err.message);
          return Response.json(
            { error: "Activation failed transiently; MoonPay will retry." },
            { status: 500 },
          );
        }
        if (st === 402) {
          await markActivationPendingCredit(sid, err.message);
          await logEvent({ actorType: "system", action: "rental.pending_credit", targetType: "rental", targetId: rental.id, metadata: { method: "moonpay" } });
          console.error(`[ALERT] moonpay: insufficient CellGods credit — rental=${rental.id} queued: ${err.message}`);
        } else {
          // Terminal — no auto-refund for crypto; mark + alert for manual refund.
          await markRefunded(sid);
          await logEvent({ actorType: "system", action: "rental.refunded", targetType: "rental", targetId: rental.id, metadata: { method: "moonpay", status: st, manual: true } });
          console.error(`[ALERT] moonpay: terminal activation failure rental=${rental.id} status=${st} — MANUAL crypto refund required: ${err.message}`);
        }
      } else {
        console.error(`[ALERT] moonpay: post-activation persistence failure rental=${rental.id} — reconcile required`);
        return Response.json({ error: "Activation persisted partially; reconcile required." }, { status: 500 });
      }
    }
  }

  await markEventProcessed(eventId, "moonpay.completed");
  return Response.json({ received: true });
}
