import { and, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { subscriptions, webhookEvents, type Subscription } from "@/db/schema";

export async function getActiveSubscription(
  userId: string,
  deviceId: string,
): Promise<Subscription | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.deviceId, deviceId),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);
  return rows[0];
}

type UpsertInput = {
  userId: string;
  deviceId: string;
  cycle: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: Date | null;
};

/**
 * Insert or update a subscription keyed by its Stripe subscription id.
 * Atomic via ON CONFLICT against the UNIQUE constraint on stripe_subscription_id,
 * so retried/concurrent webhook deliveries can't create duplicate rows.
 */
export async function upsertSubscriptionByStripeId(data: UpsertInput): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        status: data.status,
        cycle: data.cycle,
        deviceId: data.deviceId,
        currentPeriodEnd: data.currentPeriodEnd,
      },
    });
}

export async function updateSubscriptionStatusByStripeId(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd: Date | null,
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(subscriptions)
    .set({ status, currentPeriodEnd })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

/** Returns true if this Stripe event id has already been handled. */
export async function alreadyProcessed(eventId: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  const rows = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, eventId))
    .limit(1);
  return Boolean(rows[0]);
}

/** Record a Stripe event id as processed (no-op if already recorded). */
export async function markEventProcessed(
  eventId: string,
  type: string,
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .insert(webhookEvents)
    .values({ id: eventId, type })
    .onConflictDoNothing();
}
