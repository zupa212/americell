import { auth } from "@/auth";
import { deactivate } from "@/lib/cellgods";
import { getRentalForUser, markDeactivated } from "@/lib/rentals";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/rentals/[id]/cancel — customer-initiated cancel of a live rental
 * (§5.5 E / §7.3).
 *
 * Cancelling releases the phone on CellGods via `/deactivate` and moves the
 * rental to the terminal `deactivated` state. There is NO refund — CellGods
 * `/deactivate` never refunds credit, and refunds (if any) only ever happen on
 * AMERICELL's own Stripe, never by deactivating to "get money back" (§7.3).
 *
 * Gates:
 *  - 401 if unauthenticated.
 *  - 403 if the rental isn't found for this user.
 *
 * Order of operations: release on CellGods FIRST (only when a `cellgodsOrderId`
 * exists — a never-activated rental has none), then CAS the DB to `deactivated`.
 * `markDeactivated` is guarded to `active`, so double-cancel is a harmless no-op.
 * If the CellGods call throws we surface the error and leave the DB untouched so
 * the user can retry rather than stranding a still-live phone as "deactivated".
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }

  const { id } = await params;
  const rental = await getRentalForUser(id, session.user.id);
  if (!rental) {
    return Response.json(
      { error: "Forbidden" },
      { status: 403, headers: NO_STORE },
    );
  }

  if (rental.cellgodsOrderId) {
    await deactivate(rental.cellgodsOrderId);
  }
  await markDeactivated(rental.stripeSessionId);

  // Audit: customer-initiated cancel (best-effort, never blocks the response).
  await logEvent({
    actorType: "customer",
    actorEmail: session.user.email,
    actorId: session.user.id,
    action: "rental.cancelled",
    targetType: "rental",
    targetId: rental.id,
    metadata: { phoneId: rental.phoneId, period: rental.billingPeriod },
  });

  return Response.json({ ok: true }, { headers: NO_STORE });
}
