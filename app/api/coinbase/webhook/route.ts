import { isDbConfigured } from "@/lib/db";
import { isCellgodsConfigured } from "@/lib/cellgods";
import {
  isCoinbaseConfigured,
  verifyCoinbaseWebhook,
  type CoinbaseEvent,
} from "@/lib/coinbase";
import { fulfillCryptoRental } from "@/lib/crypto-fulfill";

/** Coinbase Commerce webhook → exactly-once activation on a confirmed charge. */
export async function POST(req: Request) {
  if (!isCoinbaseConfigured) {
    return Response.json({ error: "Coinbase Commerce not configured." }, { status: 503 });
  }
  if (!isDbConfigured || !isCellgodsConfigured) {
    return Response.json({ error: "Not configured." }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("x-cc-webhook-signature");
  if (!verifyCoinbaseWebhook(raw, sig)) {
    return Response.json({ error: "Signature verification failed." }, { status: 400 });
  }

  let payload: CoinbaseEvent;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ev = payload.event;
  const type = ev?.type;
  const rentalId = ev?.data?.metadata?.rentalId;
  const chargeId = ev?.data?.id ?? ev?.id;

  // Only 'charge:confirmed' means fully paid. 'charge:resolved' also fires for
  // UNDERPAID/overpaid charges an admin later resolved — never activate on that,
  // or we'd deliver a paid-in-full rental for a short payment.
  if (type !== "charge:confirmed" || !rentalId || !chargeId) {
    return Response.json({ received: true });
  }

  const result = await fulfillCryptoRental({
    rentalId,
    eventId: `coinbase:${chargeId}`,
    txId: String(chargeId),
    method: "coinbase",
  });
  return Response.json(result.body, { status: result.httpStatus });
}
