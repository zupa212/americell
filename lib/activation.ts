import "server-only";

/**
 * Exactly-once rental activation — SERVER ONLY (RESELLER_PLAN §5.5C, §7.2, §5.6).
 *
 * Shared by the Stripe webhook (`app/api/webhook/route.ts`) and the Phase-5
 * reconcile/retry cron. The `server-only` import guarantees this never reaches a
 * client bundle (it touches the CellGods key path, PIN encryption, and the DB).
 *
 * PRECONDITION (caller's job, §7.2 layer 3): the rental must already be claimed
 * via `beginActivation`'s compare-and-swap, so at most one caller runs `activate`
 * per rental. This function deliberately does NOT catch `CellgodsError` — it lets
 * it propagate (carrying `.status`) so the webhook can branch the failure into
 * transient / pending-credit / terminal handling.
 */

import { activate, type BillingPeriod } from "@/lib/cellgods";
import { encryptPin } from "@/lib/crypto";
import { finalizeActivation } from "@/lib/rentals";
import type { Rental } from "@/db/schema";

/**
 * Activate `rental` on CellGods and persist the result.
 *
 * 1. `cellgods.activate(...)` — spends reseller credit, mints an order, returns
 *    the PIN + stream URL + actual `charged_cents`. Throws `CellgodsError` on
 *    failure (402 low credit, 409/400 terminal, 429/500/0 transient).
 * 2. `finalizeActivation(...)` — persists status→active, the AES-encrypted PIN,
 *    stream URL, expiry, and the actual wholesale `charged_cents`. We persist
 *    UNCONDITIONALLY after a successful activate: the order already exists and
 *    the credit is already spent, so the PIN MUST be stored or the paying
 *    customer loses access to something they bought.
 * 3. Money-safety invariant (§5.6): assert `charged_cents <= retailCents`. A
 *    violation means we somehow sold below cost — we alert LOUDLY (not silent)
 *    but do NOT unwind: the phone is live and the customer already paid, so the
 *    delivered entitlement stands and ops reconciles the margin after the fact.
 */
export async function activateRental(rental: Rental): Promise<void> {
  const result = await activate({
    phone_id: rental.phoneId,
    customer_email: rental.customerEmail,
    duration_days: rental.durationDays,
    billing_period: rental.billingPeriod as BillingPeriod,
  });

  await finalizeActivation(rental.stripeSessionId, {
    cellgodsOrderId: result.order_id,
    streamUrl: result.stream_url,
    pinCiphertext: encryptPin(result.pin),
    expiresAt: new Date(result.expires_at),
    chargedCents: result.charged_cents,
  });

  if (result.charged_cents > rental.retailCents) {
    // §5.6: never sell below cost. Alert; do not silently continue. No secrets logged.
    console.error(
      `[ALERT] margin violation rental=${rental.id} session=${rental.stripeSessionId}: ` +
        `charged ${result.charged_cents}c > retail ${rental.retailCents}c`,
    );
  }
}
