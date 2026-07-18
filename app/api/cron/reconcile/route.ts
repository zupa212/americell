import { stripe, isStripeConfigured } from "@/lib/stripe";
import { isDbConfigured } from "@/lib/db";
import { CellgodsError, getBalance } from "@/lib/cellgods";
import {
  listReconcilable,
  beginActivation,
  retryPendingCredit,
  markActivationPendingCredit,
  markActivationFailedTransient,
  markRefunded,
} from "@/lib/rentals";
import { activateRental } from "@/lib/activation";
import { sendOpsAlert } from "@/lib/alerts";
import { logEvent } from "@/lib/logs";

/**
 * GET /api/cron/reconcile — the recovery loop the money path depends on.
 *
 * Re-drives rentals that are paid but not live: `paid` (a transient failure or a
 * missed webhook redelivery) and `activation_pending_credit` (the exact CellGods
 * low-credit case). Claims each via the same CAS gates the webhook uses, retries
 * `activateRental`, and branches failures identically (transient → paid, 402 →
 * pending_credit, terminal → refund + alert). Runs on a Vercel cron; also
 * manually callable with `Authorization: Bearer $CRON_SECRET`.
 */
export const dynamic = "force-dynamic";

const SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  if (!SECRET || req.headers.get("authorization") !== `Bearer ${SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isDbConfigured) {
    return Response.json({ ok: true, skipped: "db-unconfigured" });
  }

  const rows = await listReconcilable();
  const stats = { scanned: rows.length, activated: 0, transient: 0, pendingCredit: 0, refunded: 0, errors: 0, claimedElsewhere: 0 };

  for (const r of rows) {
    const sid = r.stripeSessionId;
    try {
      const owned =
        r.status === "paid"
          ? await beginActivation(sid)
          : await retryPendingCredit(sid);
      if (!owned) {
        stats.claimedElsewhere += 1; // another worker / the webhook got it
        continue;
      }

      try {
        await activateRental(owned);
        stats.activated += 1;
        await logEvent({
          actorType: "system",
          action: "rental.activated",
          targetType: "rental",
          targetId: owned.id,
          metadata: { via: "reconcile-cron", model: owned.model },
        });
      } catch (err) {
        if (err instanceof CellgodsError) {
          const status = err.status;
          if (status === 429 || status === 500 || status === 0) {
            // Transient — back to `paid`, retried next run. No alert (noisy).
            await markActivationFailedTransient(sid, err.message);
            stats.transient += 1;
          } else if (status === 402) {
            // Still low credit — re-park. The webhook already alerted once when it
            // first went pending_credit; stay quiet here to avoid per-run spam.
            await markActivationPendingCredit(sid, err.message);
            stats.pendingCredit += 1;
          } else {
            // Terminal — refund on Stripe if it was a card sale; crypto needs a
            // manual refund. Either way close the row out and alert ops.
            if (isStripeConfigured && stripe && owned.stripePaymentIntentId) {
              try {
                await stripe.refunds.create({ payment_intent: owned.stripePaymentIntentId });
              } catch (e) {
                console.error(`[cron/reconcile] refund failed rental=${owned.id}:`, (e as Error).message);
              }
              await markRefunded(sid);
              await sendOpsAlert(
                "Rental auto-refunded (reconcile)",
                `${owned.model} rental ${owned.id} failed to activate terminally (status ${status}) and was refunded on Stripe.`,
              );
            } else {
              await markRefunded(sid);
              await sendOpsAlert(
                "Crypto rental needs a MANUAL refund",
                `${owned.model} rental ${owned.id} failed to activate terminally (status ${status}). It was paid via crypto — issue a manual refund. Error: ${err.message}`,
              );
            }
            stats.refunded += 1;
            await logEvent({
              actorType: "system",
              action: "rental.refunded",
              targetType: "rental",
              targetId: owned.id,
              metadata: { via: "reconcile-cron", model: owned.model, status },
            });
          }
        } else {
          // activate() succeeded but persistence failed — phone is live, credit
          // spent. Leave the row `activating` and alert for a manual reconcile.
          console.error(`[cron/reconcile] persistence failure rental=${owned.id}:`, (err as Error).message);
          await sendOpsAlert(
            "Reconcile: activation persisted partially",
            `${owned.model} rental ${owned.id} activated on CellGods but our persistence failed — the customer can't see the PIN/stream. Manual reconcile needed.`,
          );
          stats.errors += 1;
        }
      }
    } catch (e) {
      stats.errors += 1;
      console.error(`[cron/reconcile] rental=${r.id}:`, (e as Error).message);
    }
  }

  // Proactive low-credit alert: warn before customers get stuck. Fires when the
  // balance is below your CellGods auto-topup threshold (or a $20 floor). The
  // permanent fix is enabling CellGods auto top-up; this is the safety net.
  let credit: number | null = null;
  try {
    const bal = await getBalance();
    credit = bal.credit_balance_cents;
    const threshold = bal.auto_topup?.threshold_cents ?? 2000;
    if (credit < threshold) {
      await sendOpsAlert(
        "CellGods credit is low",
        `Your CellGods credit is $${(credit / 100).toFixed(2)} — below $${(threshold / 100).toFixed(2)}. Top up so activations don't stall. (${stats.pendingCredit} rental(s) are waiting on credit right now.)`,
      );
    }
  } catch {
    // balance read is best-effort; never fail the cron on it
  }

  return Response.json(
    { ok: true, creditCents: credit, ...stats },
    { headers: { "Cache-Control": "no-store" } },
  );
}
