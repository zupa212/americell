/**
 * Discount coupons for the CRYPTO checkout (the card flow uses Stripe's native
 * promotion codes). PURE + client-safe (no `server-only`): the client dialog
 * imports it to preview the discounted price, and the crypto route imports it to
 * RE-VALIDATE and apply the discount server-side — the client is never trusted.
 *
 * Coupons are not secret (customers type them), so keeping them here is fine.
 * Keep the code + amount IN SYNC with the matching Stripe promotion code so the
 * same code discounts both card and crypto.
 */

export type Coupon = {
  /** The code the customer types (matched case-insensitively). */
  code: string;
  /** Fixed amount off, in the SAME integer-cents currency as retail. */
  amountOffCents: number;
  /** Retail currency this coupon applies to (e.g. "eur"). */
  currency: string;
  /** Minimum order (cents) for the coupon to apply. */
  minOrderCents: number;
  /** Short human label, e.g. "€50 off". */
  label: string;
};

// Keep AMERICELL50 identical to the Stripe promotion code (€50 off, min €50).
const COUPONS: readonly Coupon[] = [
  {
    code: "AMERICELL50",
    amountOffCents: 5000,
    currency: "eur",
    minOrderCents: 5000,
    label: "€50 off",
  },
];

/** Look up a coupon by code (case-insensitive, trimmed). */
export function findCoupon(code: string | null | undefined): Coupon | null {
  if (!code) return null;
  const norm = code.trim().toUpperCase();
  if (!norm) return null;
  return COUPONS.find((c) => c.code.toUpperCase() === norm) ?? null;
}

/**
 * Discount (integer cents) for `code` on an order of `retailCents` in `currency`.
 * Returns 0 for an unknown/ineligible code. Never discounts below €0.50 so the
 * charge stays payable.
 */
export function couponDiscountCents(
  code: string | null | undefined,
  retailCents: number,
  currency: string,
): number {
  const c = findCoupon(code);
  if (!c) return 0;
  if (c.currency.toLowerCase() !== currency.toLowerCase()) return 0;
  if (retailCents < c.minOrderCents) return 0;
  return Math.min(c.amountOffCents, Math.max(0, retailCents - 50));
}
