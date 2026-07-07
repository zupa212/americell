import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * NOWPayments — a non-custodial crypto gateway. Customers pay in 100+ coins with
 * NO customer KYC; funds forward to your payout wallet. SERVER ONLY.
 */

const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;
const API_BASE = "https://api.nowpayments.io/v1";

export const isNowpaymentsConfigured = Boolean(API_KEY);

export type NowpaymentsInvoiceInput = {
  amountUsd: number;
  orderId: string; // rental id
  description: string;
  ipnUrl: string;
  successUrl?: string;
  cancelUrl?: string;
};

export async function createNowpaymentsInvoice(
  input: NowpaymentsInvoiceInput,
): Promise<{ url: string }> {
  if (!API_KEY) throw new Error("NOWPayments is not configured");
  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: { "x-api-key": API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      price_amount: input.amountUsd,
      price_currency: "usd",
      order_id: input.orderId,
      order_description: input.description,
      ipn_callback_url: input.ipnUrl,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NOWPayments invoice failed: ${res.status}`);
  const data = (await res.json()) as { invoice_url?: string };
  if (!data.invoice_url) throw new Error("NOWPayments: missing invoice_url");
  return { url: data.invoice_url };
}

/** Deterministic, key-sorted JSON — NOWPayments signs the sorted body. */
function sortedJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(sortedJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${sortedJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** IPN signature = HMAC-SHA512(IPN_SECRET, sortedJson(body)), hex, in `x-nowpayments-sig`. */
export function verifyNowpaymentsIpn(
  rawBody: string,
  sig: string | null,
): boolean {
  if (!IPN_SECRET || !sig) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const expected = createHmac("sha512", IPN_SECRET)
    .update(sortedJson(parsed))
    .digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type NowpaymentsIpn = {
  payment_status?: string; // "finished" | "confirmed" | "partially_paid" | ...
  order_id?: string;
  payment_id?: string | number;
};
