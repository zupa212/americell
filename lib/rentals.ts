import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { rentals, type Rental } from "@/db/schema";
import type { BillingPeriod, Platform } from "@/lib/cellgods";

/**
 * DB helpers for the `rentals` table (§5.2), the reseller mirror of
 * `lib/subscriptions.ts`. Every helper is guarded by `isDbConfigured` so the
 * app boots without a database, and every state transition is a
 * single-statement compare-and-swap (`UPDATE … WHERE status=$prev RETURNING *`)
 * because Neon's HTTP driver has NO interactive transactions. The CAS predicate
 * IS the lock: only the first caller to flip a status observes the returned
 * row, so a replayed Stripe webhook can never double-activate.
 *
 * Status machine (§5.4):
 *   pending_payment → paid → activating → active
 *   activating → activation_pending_credit   (402, credit too low)
 *   activating → paid                         (transient failure, Stripe retries)
 *   activating | activation_pending_credit → refunded
 *   active → deactivated                      (customer/admin cancel)
 *   active → expired                          (lazy expiry past expiresAt)
 * Terminal: refunded | expired | deactivated.
 *
 * All money is INTEGER CENTS.
 */

// ── Create ───────────────────────────────────────────────────────────────────

/** Fields snapshotted onto a rental at checkout time (before payment, §5.5 B5). */
export type CreatePendingRentalInput = {
  userId: string;
  customerEmail: string; // provisioned email (may differ from the account email)
  phoneId: string;
  model: string;
  platform: Platform;
  billingPeriod: BillingPeriod;
  durationDays: number;
  wholesaleQuotedCents: number; // wholesale snapshot at checkout
  retailCents: number; // amount charged on AMERICELL Stripe
};

/**
 * Insert a fresh rental in `pending_payment`. This runs BEFORE the Stripe
 * Checkout Session exists, because the returned `rental.id` is what gets
 * embedded in the session metadata — so the real `stripe_session_id` is bound
 * afterwards via `attachSession` (§5.5 B5→B7). The column is `NOT NULL UNIQUE`
 * (the idempotency key, §7.2 layer 2), so we seed it with a unique, non-`cs_`
 * placeholder that `attachSession` overwrites; it can never collide with a real
 * Stripe id or be matched by a webhook lookup.
 *
 * Throws when the DB is unconfigured — callers must gate on `isDbConfigured`
 * (→ 503) before reaching checkout.
 */
export async function createPendingRental(
  v: CreatePendingRentalInput,
): Promise<Rental> {
  if (!isDbConfigured) {
    throw new Error("DATABASE_URL is not set; cannot create a rental.");
  }
  const [row] = await db
    .insert(rentals)
    .values({
      userId: v.userId,
      customerEmail: v.customerEmail,
      phoneId: v.phoneId,
      model: v.model,
      platform: v.platform,
      billingPeriod: v.billingPeriod,
      durationDays: v.durationDays,
      wholesaleQuotedCents: v.wholesaleQuotedCents,
      retailCents: v.retailCents,
      stripeSessionId: `pending_${randomUUID()}`,
      status: "pending_payment",
    })
    .returning();
  return row;
}

/**
 * Bind the real Stripe Checkout Session id to a freshly-created pending rental
 * (§5.5 B7), replacing the `pending_…` placeholder. This is the webhook's
 * idempotency key (§7.2). Runs before the checkout URL is handed to the client,
 * so it always completes before any webhook could fire — no race.
 */
export async function attachSession(
  rentalId: string,
  sessionId: string,
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(rentals)
    .set({ stripeSessionId: sessionId, updatedAt: new Date() })
    .where(eq(rentals.id, rentalId));
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getRentalBySession(
  sid: string,
): Promise<Rental | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .select()
    .from(rentals)
    .where(eq(rentals.stripeSessionId, sid))
    .limit(1);
  return rows[0];
}

export async function getRentalById(id: string): Promise<Rental | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .select()
    .from(rentals)
    .where(eq(rentals.id, id))
    .limit(1);
  return rows[0];
}

/** Ownership-checked read — mirrors `getActiveSubscription`'s user gate (§7.4). */
export async function getRentalForUser(
  id: string,
  userId: string,
): Promise<Rental | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .select()
    .from(rentals)
    .where(and(eq(rentals.id, id), eq(rentals.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Dashboard listing, newest first. Never exposes pin/streamUrl to callers directly. */
export async function listRentalsForUser(userId: string): Promise<Rental[]> {
  if (!isDbConfigured) return [];
  return db
    .select()
    .from(rentals)
    .where(eq(rentals.userId, userId))
    .orderBy(desc(rentals.createdAt));
}

// ── State transitions (compare-and-swap) ─────────────────────────────────────

/**
 * CAS `pending_payment → paid`, recording the PaymentIntent. Returns the row on
 * the first winning delivery; `undefined` if it was already past
 * `pending_payment` (idempotent under Stripe's at-least-once delivery).
 */
export async function markPaid(
  sid: string,
  paymentIntentId: string | null,
): Promise<Rental | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .update(rentals)
    .set({
      status: "paid",
      stripePaymentIntentId: paymentIntentId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(rentals.stripeSessionId, sid),
        eq(rentals.status, "pending_payment"),
      ),
    )
    .returning();
  return rows[0];
}

/**
 * The exactly-once activation claim (§7.2 layer 3): CAS `paid → activating` and
 * bump `activation_attempts`. Only the first concurrent webhook delivery gets a
 * row back and may call `cellgods.activate`; all others get `undefined` and must
 * return without touching CellGods.
 */
export async function beginActivation(
  sid: string,
): Promise<Rental | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .update(rentals)
    .set({
      status: "activating",
      activationAttempts: sql`${rentals.activationAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(rentals.stripeSessionId, sid), eq(rentals.status, "paid")))
    .returning();
  return rows[0];
}

/** Data persisted once `cellgods.activate` succeeds. */
export type FinalizeActivationInput = {
  cellgodsOrderId: string; // UNIQUE backstop against double-mint
  streamUrl: string; // 4h token URL
  pinCiphertext: string; // AES-256-GCM blob, never plaintext
  expiresAt: Date; // rental expiry (from activate.expires_at)
  chargedCents: number; // actual wholesale from activate.charged_cents
};

/**
 * CAS `activating → active`, storing the CellGods order, stream URL, encrypted
 * PIN, and stamping `streamMintedAt`/`activatedAt`. Clears any prior transient
 * `lastError`. No return value — the caller already holds the claimed row.
 */
export async function finalizeActivation(
  sid: string,
  a: FinalizeActivationInput,
): Promise<void> {
  if (!isDbConfigured) return;
  const now = new Date();
  await db
    .update(rentals)
    .set({
      status: "active",
      cellgodsOrderId: a.cellgodsOrderId,
      streamUrl: a.streamUrl,
      pinCiphertext: a.pinCiphertext,
      streamMintedAt: now,
      expiresAt: a.expiresAt,
      chargedCents: a.chargedCents,
      activatedAt: now,
      lastError: null,
      updatedAt: now,
    })
    .where(
      and(eq(rentals.stripeSessionId, sid), eq(rentals.status, "activating")),
    );
}

/**
 * 402 path: CAS `activating → activation_pending_credit`. Payment is captured
 * but reseller credit is too low; ops is alerted and top-up/cron recovery takes
 * over (§7.3). Records the error for the admin surface.
 */
export async function markActivationPendingCredit(
  sid: string,
  err: string,
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(rentals)
    .set({
      status: "activation_pending_credit",
      lastError: err,
      updatedAt: new Date(),
    })
    .where(
      and(eq(rentals.stripeSessionId, sid), eq(rentals.status, "activating")),
    );
}

/**
 * Transient failure (429/5xx/network): CAS `activating → paid` so the webhook
 * can return 500 and let Stripe redeliver. `activation_attempts` stays at its
 * incremented value; the next `beginActivation` re-claims cleanly.
 */
export async function markActivationFailedTransient(
  sid: string,
  err: string,
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(rentals)
    .set({ status: "paid", lastError: err, updatedAt: new Date() })
    .where(
      and(eq(rentals.stripeSessionId, sid), eq(rentals.status, "activating")),
    );
}

/**
 * Terminal `→ refunded` for a rental that was charged but never went live —
 * the webhook 409/400 path and the Phase-5 credit-timeout cron. Guarded to the
 * in-flight, not-yet-live states so it can never "refund" a live (`active`)
 * rental (which would be the deactivate-to-refund anti-pattern §7.3 forbids).
 * Refunds happen on AMERICELL Stripe; this only records the DB status.
 */
export async function markRefunded(sid: string): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(rentals)
    .set({ status: "refunded", updatedAt: new Date() })
    .where(
      and(
        eq(rentals.stripeSessionId, sid),
        inArray(rentals.status, ["activating", "activation_pending_credit"]),
      ),
    );
}

/** Terminal `active → deactivated` (customer/admin cancel of a live rental). */
export async function markDeactivated(sid: string): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(rentals)
    .set({ status: "deactivated", updatedAt: new Date() })
    .where(and(eq(rentals.stripeSessionId, sid), eq(rentals.status, "active")));
}

/**
 * Lazy expiry (§5.5 D): CAS `active → expired`, keyed by rental id, only when
 * `expiresAt` has actually passed. Safe to call opportunistically on dashboard
 * reads.
 */
export async function markExpired(id: string): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(rentals)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(rentals.id, id),
        eq(rentals.status, "active"),
        sql`${rentals.expiresAt} < now()`,
      ),
    );
}
