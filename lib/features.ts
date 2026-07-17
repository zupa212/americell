/**
 * Simple feature flags (client-safe — no server-only, no env at runtime).
 * Flip a value and redeploy.
 */

/**
 * Crypto / MoonPay checkout. Temporarily OFF — customers pay with card (Stripe)
 * only. Flip to `true` and redeploy to bring the "Pay with crypto" options back
 * (both the UI buttons and the /api/crypto/checkout + /api/moonpay/url routes
 * read this flag).
 */
export const CRYPTO_ENABLED = false;

/** Public Telegram support/contact link — shown in the footer and help bubble. */
export const TELEGRAM_URL = "https://t.me/americell";
