import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * BTCPay Server — self-hosted, non-custodial, 100% no-KYC. Crypto is paid
 * peer-to-peer straight into YOUR wallet; no third party ever holds funds and
 * neither you nor the customer does any identity verification. SERVER ONLY.
 *
 * Uses the Greenfield API (create invoice) + a store webhook (InvoiceSettled).
 */

const BASE = process.env.BTCPAY_URL?.replace(/\/+$/, ""); // e.g. https://btcpay.you.com
const API_KEY = process.env.BTCPAY_API_KEY;
const STORE_ID = process.env.BTCPAY_STORE_ID;
const WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET;

export const isBtcpayConfigured = Boolean(BASE && API_KEY && STORE_ID);

export type BtcpayInvoiceInput = {
  amountUsd: number; // amount in `currency`
  currency?: string; // ISO code, default usd
  orderId: string; // rental id
  description: string;
  redirectUrl?: string;
};

export async function createBtcpayInvoice(
  input: BtcpayInvoiceInput,
): Promise<{ url: string }> {
  if (!BASE || !API_KEY || !STORE_ID) {
    throw new Error("BTCPay is not configured");
  }
  const res = await fetch(`${BASE}/api/v1/stores/${STORE_ID}/invoices`, {
    method: "POST",
    headers: {
      Authorization: `token ${API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountUsd.toFixed(2),
      currency: (input.currency ?? "usd").toUpperCase(),
      metadata: { orderId: input.orderId, itemDesc: input.description },
      checkout: input.redirectUrl ? { redirectURL: input.redirectUrl } : undefined,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BTCPay invoice failed: ${res.status}`);
  const data = (await res.json()) as { checkoutLink?: string };
  if (!data.checkoutLink) throw new Error("BTCPay: missing checkoutLink");
  return { url: data.checkoutLink };
}

/** Webhook signature = "sha256=" + HMAC-SHA256(WEBHOOK_SECRET, rawBody), in `BTCPay-Sig`. */
export function verifyBtcpaySig(
  rawBody: string,
  sigHeader: string | null,
): boolean {
  if (!WEBHOOK_SECRET || !sigHeader) return false;
  const provided = sigHeader.startsWith("sha256=")
    ? sigHeader.slice("sha256=".length)
    : sigHeader;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Fallback: some BTCPay versions omit `metadata` from the webhook body. If so we
 * fetch the invoice and read `metadata.orderId` (our rental id). Best-effort.
 */
export async function fetchBtcpayOrderId(invoiceId: string): Promise<string | null> {
  if (!BASE || !API_KEY || !STORE_ID) return null;
  try {
    const res = await fetch(
      `${BASE}/api/v1/stores/${STORE_ID}/invoices/${invoiceId}`,
      { headers: { Authorization: `token ${API_KEY}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { metadata?: { orderId?: string } };
    return data.metadata?.orderId ?? null;
  } catch {
    return null;
  }
}

export type BtcpayWebhook = {
  type?: string; // "InvoiceSettled" | "InvoiceProcessing" | "InvoiceExpired" | ...
  invoiceId?: string;
  metadata?: { orderId?: string };
};
