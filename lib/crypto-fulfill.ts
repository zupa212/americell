import "server-only";

import { CellgodsError } from "@/lib/cellgods";
import {
  beginActivation,
  getRentalById,
  markActivationFailedTransient,
  markActivationPendingCredit,
  markPaid,
  markRefunded,
} from "@/lib/rentals";
import { activateRental } from "@/lib/activation";
import { alreadyProcessed, markEventProcessed } from "@/lib/subscriptions";
import { logEvent } from "@/lib/logs";
import { sendOpsAlert } from "@/lib/alerts";

export type FulfillResult = { httpStatus: number; body: Record<string, unknown> };

/**
 * Shared exactly-once fulfilment for ANY crypto-provider webhook (MoonPay,
 * NOWPayments, Coinbase Commerce). Same three-layer idempotency as Stripe:
 * event-id dedup + the rental's UNIQUE payment ref + the `beginActivation` CAS.
 * Writes audit logs. Crypto has NO auto-refund, so terminal failures mark the
 * rental refunded + alert for a MANUAL refund.
 */
export async function fulfillCryptoRental(opts: {
  rentalId: string;
  eventId: string;
  txId: string;
  method: string;
}): Promise<FulfillResult> {
  const { rentalId, eventId, txId, method } = opts;

  if (await alreadyProcessed(eventId)) {
    return { httpStatus: 200, body: { received: true, duplicate: true } };
  }

  const rental = await getRentalById(rentalId);
  if (!rental) {
    console.warn(`[${method}] no rental for id=${rentalId}`);
    await markEventProcessed(eventId, `${method}.completed`);
    return { httpStatus: 200, body: { received: true } };
  }

  const sid = rental.stripeSessionId;
  await markPaid(sid, txId);
  const owned = await beginActivation(sid);

  if (owned) {
    try {
      await activateRental(owned);
      await logEvent({
        actorType: "system",
        action: "rental.activated",
        targetType: "rental",
        targetId: rental.id,
        metadata: { method, model: rental.model, retailCents: rental.retailCents },
      });
    } catch (err) {
      if (err instanceof CellgodsError) {
        const st = err.status;
        if (st === 429 || st === 500 || st === 0) {
          await markActivationFailedTransient(sid, err.message);
          return { httpStatus: 500, body: { error: "transient; provider will retry" } };
        }
        if (st === 402) {
          await markActivationPendingCredit(sid, err.message);
          await logEvent({ actorType: "system", action: "rental.pending_credit", targetType: "rental", targetId: rental.id, metadata: { method } });
          console.error(`[ALERT] ${method}: insufficient CellGods credit rental=${rental.id}`);
          await sendOpsAlert(
            "Low CellGods credit — activation on hold",
            `A ${method} payment for rental ${rental.id} (${rental.model}) is paid but couldn't activate: insufficient CellGods credit. Top up, then it will activate.`,
          );
        } else {
          await markRefunded(sid);
          await logEvent({ actorType: "system", action: "rental.refunded", targetType: "rental", targetId: rental.id, metadata: { method, status: st, manual: true } });
          console.error(`[ALERT] ${method}: terminal activation failure rental=${rental.id} status=${st} — MANUAL crypto refund required`);
          await sendOpsAlert(
            "MANUAL crypto refund required",
            `A ${method} payment for rental ${rental.id} (${rental.model}) was PAID but activation failed terminally (status ${st}). Crypto is not auto-refundable — issue a manual refund.`,
          );
        }
      } else {
        console.error(`[ALERT] ${method}: post-activation persistence failure rental=${rental.id} — reconcile required`);
        return { httpStatus: 500, body: { error: "reconcile required" } };
      }
    }
  }

  await markEventProcessed(eventId, `${method}.completed`);
  return { httpStatus: 200, body: { received: true } };
}
