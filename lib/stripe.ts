import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/** True only when a Stripe secret key is configured. */
export const isStripeConfigured = Boolean(key);

/**
 * Stripe client, or null in "demo mode" (no key set). Callers should branch on
 * `isStripeConfigured` and return a 503 so the UI can fall back gracefully.
 */
export const stripe: Stripe | null = key ? new Stripe(key, { typescript: true }) : null;
