import { auth } from "@/auth";
import { decryptPin } from "@/lib/crypto";
import { getRentalForUser } from "@/lib/rentals";

/**
 * GET /api/rentals/[id]/pin — reveal the CellGods PIN to the owner (§5.5 E).
 *
 * The PIN is stored AES-256-GCM-encrypted at rest (`pinCiphertext`) and is
 * decrypted ONLY here, behind the same ownership check as /access. It is never
 * included in list responses (/api/me) or in the /access payload, so a stolen
 * stream URL alone can't re-mint access.
 *
 * Gates:
 *  - 401 if unauthenticated.
 *  - 403 if the rental isn't found for this user (see /access for why 403).
 *  - 410 Gone if there's no encrypted PIN yet (rental never activated).
 *
 * `Cache-Control: no-store` on every response — this is a bare secret.
 */

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

  if (!rental.pinCiphertext) {
    return Response.json(
      { error: "No PIN is available for this rental." },
      { status: 410, headers: NO_STORE },
    );
  }

  const pin = decryptPin(rental.pinCiphertext);
  return Response.json({ pin }, { headers: NO_STORE });
}
