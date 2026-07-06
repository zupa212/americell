import { auth } from "@/auth";
import { getRentalForUser } from "@/lib/rentals";

/**
 * GET /api/rentals/[id]/access — the customer's "open control" read (§5.5 E).
 *
 * Returns the CellGods stream URL and both clocks the dashboard shows, but
 * NEVER the PIN (that lives behind the ownership-checked /pin route). We only
 * *read* stored activation data here — we never re-call `cellgods.activate`.
 *
 * Gates:
 *  - 401 if unauthenticated.
 *  - 403 if the rental isn't found for this user (getRentalForUser filters by
 *    both id AND userId, so "someone else's rental" is indistinguishable from
 *    "no such rental" — both are 403, never leaking existence).
 *  - 410 Gone if the rental isn't live: any non-`active` status, or an `active`
 *    rental whose `expiresAt` has already passed (its stream URL is dead).
 *
 * `Cache-Control: no-store` on every response — this is per-user secret data.
 */

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(
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

  const isExpired = rental.expiresAt
    ? rental.expiresAt.getTime() <= Date.now()
    : false;
  if (rental.status !== "active" || isExpired) {
    return Response.json(
      { error: "This rental is not active." },
      { status: 410, headers: NO_STORE },
    );
  }

  // Two distinct clocks (§5.5 E): the 4h stream-token session vs the rental
  // itself. `tokenFresh` drives the dashboard hint — when stale, the UI
  // foregrounds the PIN so CellGods can re-mint a fresh URL from it.
  const mintedAt = rental.streamMintedAt;
  const tokenFresh = mintedAt
    ? Date.now() - mintedAt.getTime() < FOUR_HOURS_MS
    : false;
  const tokenExpiresAt = mintedAt
    ? new Date(mintedAt.getTime() + FOUR_HOURS_MS)
    : null;

  return Response.json(
    {
      streamUrl: rental.streamUrl,
      expiresAt: rental.expiresAt,
      tokenFresh,
      tokenExpiresAt,
    },
    { headers: NO_STORE },
  );
}
