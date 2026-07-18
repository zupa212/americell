import { isDbConfigured } from "@/lib/db";
import { isCellgodsConfigured } from "@/lib/cellgods";
import {
  isNowpaymentsConfigured,
  verifyNowpaymentsIpn,
  type NowpaymentsIpn,
} from "@/lib/nowpayments";
import { fulfillCryptoRental } from "@/lib/crypto-fulfill";
import { sendOpsAlert } from "@/lib/alerts";

/** NOWPayments IPN → exactly-once activation on a settled payment. */
export async function POST(req: Request) {
  if (!isNowpaymentsConfigured) {
    return Response.json({ error: "NOWPayments not configured." }, { status: 503 });
  }
  if (!isDbConfigured || !isCellgodsConfigured) {
    return Response.json({ error: "Not configured." }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("x-nowpayments-sig");
  if (!verifyNowpaymentsIpn(raw, sig)) {
    return Response.json({ error: "Signature verification failed." }, { status: 400 });
  }

  let ipn: NowpaymentsIpn;
  try {
    ipn = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const status = ipn.payment_status;
  const rentalId = ipn.order_id;
  const txId = ipn.payment_id != null ? String(ipn.payment_id) : undefined;

  // Only fulfil on a settled payment (finished/confirmed) mapped to a rental.
  if ((status !== "finished" && status !== "confirmed") || !rentalId || !txId) {
    return Response.json({ received: true });
  }

  // Defensive underpayment guard: 'finished' already implies a full settle, but
  // if the crypto amounts are present require the received amount to cover the
  // expected one — never activate (and spend wholesale) on a short payment.
  if (
    ipn.pay_amount != null &&
    ipn.actually_paid != null &&
    ipn.actually_paid < ipn.pay_amount
  ) {
    console.error(
      `[ALERT] nowpayments underpaid rental=${rentalId}: actually_paid=${ipn.actually_paid} < pay_amount=${ipn.pay_amount}`,
    );
    await sendOpsAlert(
      "Crypto underpayment — not activated",
      `NOWPayments rental ${rentalId} was underpaid (${ipn.actually_paid} < ${ipn.pay_amount} crypto). Not activated — review manually.`,
    );
    return Response.json({ received: true, underpaid: true });
  }

  const result = await fulfillCryptoRental({
    rentalId,
    eventId: `nowpayments:${txId}`,
    txId,
    method: "nowpayments",
  });
  return Response.json(result.body, { status: result.httpStatus });
}
