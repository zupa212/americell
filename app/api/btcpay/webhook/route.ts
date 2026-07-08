import { isDbConfigured } from "@/lib/db";
import { isCellgodsConfigured } from "@/lib/cellgods";
import {
  fetchBtcpayOrderId,
  isBtcpayConfigured,
  verifyBtcpaySig,
  type BtcpayWebhook,
} from "@/lib/btcpay";
import { fulfillCryptoRental } from "@/lib/crypto-fulfill";

/** BTCPay Server webhook → exactly-once activation on a settled invoice. */
export async function POST(req: Request) {
  if (!isBtcpayConfigured) {
    return Response.json({ error: "BTCPay not configured." }, { status: 503 });
  }
  if (!isDbConfigured || !isCellgodsConfigured) {
    return Response.json({ error: "Not configured." }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("btcpay-sig");
  if (!verifyBtcpaySig(raw, sig)) {
    return Response.json({ error: "Signature verification failed." }, { status: 400 });
  }

  let event: BtcpayWebhook;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const invoiceId = event.invoiceId;
  // Activate only once the invoice is fully settled.
  if (event.type !== "InvoiceSettled" || !invoiceId) {
    return Response.json({ received: true });
  }

  const rentalId =
    event.metadata?.orderId ?? (await fetchBtcpayOrderId(invoiceId));
  if (!rentalId) {
    console.warn(`[btcpay] no orderId for invoice=${invoiceId}`);
    return Response.json({ received: true });
  }

  const result = await fulfillCryptoRental({
    rentalId,
    eventId: `btcpay:${invoiceId}`,
    txId: invoiceId,
    method: "btcpay",
  });
  return Response.json(result.body, { status: result.httpStatus });
}
