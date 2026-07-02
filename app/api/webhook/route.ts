import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import {
  upsertSubscriptionByStripeId,
  updateSubscriptionStatusByStripeId,
  alreadyProcessed,
  markEventProcessed,
} from "@/lib/subscriptions";

export async function POST(req: Request) {
  if (!isStripeConfigured || !stripe) {
    return Response.json({ error: "Stripe not configured." }, { status: 503 });
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

  // Idempotency: ignore an event id we've already handled (defeats retries/replay).
  if (await alreadyProcessed(event.id)) {
    return Response.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id ?? s.metadata?.userId;
      const deviceId = s.metadata?.deviceId;
      const cycle = s.metadata?.cycle ?? "monthly";
      const subId =
        typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
      if (userId && deviceId && subId) {
        await upsertSubscriptionByStripeId({
          userId,
          deviceId,
          cycle,
          stripeSubscriptionId: subId,
          // currentPeriodEnd is filled in by the subsequent subscription.updated event.
          status: "active",
          currentPeriodEnd: null,
        });
      } else {
        console.warn(
          `[webhook] checkout.session.completed ${s.id} missing fields; not provisioning`,
          { hasUserId: Boolean(userId), hasDeviceId: Boolean(deviceId), hasSubId: Boolean(subId) },
        );
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const status =
        event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
      // `current_period_end` location varies across Stripe API versions; read defensively.
      const cpe = (sub as unknown as { current_period_end?: number })
        .current_period_end;
      const end = cpe ? new Date(cpe * 1000) : null;
      await updateSubscriptionStatusByStripeId(sub.id, status, end);
      break;
    }
    default:
      break;
  }

  await markEventProcessed(event.id, event.type);

  return Response.json({ received: true });
}
