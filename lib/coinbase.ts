import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Coinbase Commerce — accept crypto directly to your account. No customer KYC to
 * pay a charge. SERVER ONLY.
 */

const API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
const API_BASE = "https://api.commerce.coinbase.com";

export const isCoinbaseConfigured = Boolean(API_KEY);

export type CoinbaseChargeInput = {
  amountUsd: number;
  rentalId: string;
  name: string;
  description: string;
  redirectUrl?: string;
  cancelUrl?: string;
};

export async function createCoinbaseCharge(
  input: CoinbaseChargeInput,
): Promise<{ url: string }> {
  if (!API_KEY) throw new Error("Coinbase Commerce is not configured");
  const res = await fetch(`${API_BASE}/charges`, {
    method: "POST",
    headers: {
      "X-CC-Api-Key": API_KEY,
      "X-CC-Version": "2018-03-22",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      pricing_type: "fixed_price",
      local_price: { amount: input.amountUsd.toFixed(2), currency: "USD" },
      metadata: { rentalId: input.rentalId },
      redirect_url: input.redirectUrl,
      cancel_url: input.cancelUrl,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Coinbase charge failed: ${res.status}`);
  const data = (await res.json()) as { data?: { hosted_url?: string } };
  const url = data.data?.hosted_url;
  if (!url) throw new Error("Coinbase: missing hosted_url");
  return { url };
}

/** Webhook signature = HMAC-SHA256(WEBHOOK_SECRET, rawBody), hex, in `X-CC-Webhook-Signature`. */
export function verifyCoinbaseWebhook(
  rawBody: string,
  sig: string | null,
): boolean {
  if (!WEBHOOK_SECRET || !sig) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type CoinbaseEvent = {
  event?: {
    id?: string;
    type?: string; // "charge:confirmed" | "charge:resolved" | "charge:pending" | ...
    data?: { id?: string; metadata?: { rentalId?: string } };
  };
};
