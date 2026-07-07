import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * MoonPay crypto-payment client — SERVER ONLY.
 *
 * Flow: the customer opens a SIGNED MoonPay "buy" widget URL, pays (card or
 * crypto), and MoonPay settles the retail amount as crypto into OUR wallet
 * (`MOONPAY_WALLET_ADDRESS`). A signed webhook then confirms and we activate the
 * rental — reusing the exact same exactly-once pipeline as Stripe.
 *
 * Secrets are read only here and never reach the client. Fails closed:
 * `isMoonpayConfigured` is false when keys are missing → callers return 503.
 */

const PUBLISHABLE_KEY = process.env.MOONPAY_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.MOONPAY_SECRET_KEY;
const WEBHOOK_KEY = process.env.MOONPAY_WEBHOOK_KEY;
const WALLET_ADDRESS = process.env.MOONPAY_WALLET_ADDRESS;
const CURRENCY_CODE = process.env.MOONPAY_CURRENCY_CODE ?? "usdc";
const MODE =
  process.env.MOONPAY_MODE === "production" ? "production" : "sandbox";

export const isMoonpayConfigured = Boolean(
  PUBLISHABLE_KEY && SECRET_KEY && WALLET_ADDRESS,
);

const BASE_URL =
  MODE === "production"
    ? "https://buy.moonpay.com"
    : "https://buy-sandbox.moonpay.com";

export type MoonpayUrlInput = {
  /** Retail amount in USD (dollars, may be decimal). */
  amountUsd: number;
  /** Our rental id — echoed back on the webhook as externalTransactionId. */
  externalTransactionId: string;
  email?: string;
  redirectUrl?: string;
};

/**
 * Build a signed MoonPay widget URL. The signature is HMAC-SHA256 of the URL
 * search string (including the leading "?") with the secret key, base64-encoded
 * — MoonPay's documented URL-signing scheme.
 */
export function buildMoonpayUrl(input: MoonpayUrlInput): string {
  if (!PUBLISHABLE_KEY || !SECRET_KEY || !WALLET_ADDRESS) {
    throw new Error("MoonPay is not configured");
  }
  const params = new URLSearchParams({
    apiKey: PUBLISHABLE_KEY,
    currencyCode: CURRENCY_CODE,
    baseCurrencyCode: "usd",
    baseCurrencyAmount: String(input.amountUsd),
    walletAddress: WALLET_ADDRESS,
    externalTransactionId: input.externalTransactionId,
    lockAmount: "true",
  });
  if (input.email) params.set("email", input.email);
  if (input.redirectUrl) params.set("redirectURL", input.redirectUrl);

  const search = `?${params.toString()}`;
  const signature = createHmac("sha256", SECRET_KEY)
    .update(search)
    .digest("base64");

  return `${BASE_URL}${search}&signature=${encodeURIComponent(signature)}`;
}

export type MoonpayWebhookEvent = {
  type?: string;
  data?: {
    id?: string;
    status?: string; // "completed" | "pending" | "failed" | ...
    externalTransactionId?: string;
    baseCurrencyAmount?: number;
  };
};

/**
 * Verify a MoonPay webhook. Header `Moonpay-Signature-V2` is
 * "t=<timestamp>,s=<hex>", where s = HMAC-SHA256(webhookKey, `${t}.${rawBody}`).
 * Constant-time compared. Returns false if unconfigured or malformed.
 */
export function verifyMoonpayWebhook(
  rawBody: string,
  header: string | null,
): boolean {
  if (!WEBHOOK_KEY || !header) return false;
  const parts: Record<string, string> = {};
  for (const kv of header.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const t = parts["t"];
  const s = parts["s"];
  if (!t || !s) return false;

  const expected = createHmac("sha256", WEBHOOK_KEY)
    .update(`${t}.${rawBody}`)
    .digest("hex");
  try {
    const a = Buffer.from(s, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
