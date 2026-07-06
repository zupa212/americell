import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { listRentalsForUser } from "@/lib/rentals";
import type { Rental } from "@/db/schema";

/**
 * Fields safe to expose to the authenticated owner in a list response.
 *
 * Deliberately excludes:
 *  - secrets: `streamUrl` (4h token URL) and `pinCiphertext` (encrypted PIN) —
 *    per §7.4 these are only served from the ownership-checked /access and /pin
 *    routes, never from a list endpoint.
 *  - reseller margin data: `wholesaleQuotedCents` / `chargedCents` (admin-only).
 *  - internal payment / idempotency ids and operational fields.
 */
type SafeRental = {
  id: string;
  phoneId: string;
  model: string;
  platform: string;
  billingPeriod: string;
  durationDays: number;
  retailCents: number;
  status: string;
  streamMintedAt: Date | null; // for the dashboard token-freshness hint (no URL leaked)
  expiresAt: Date | null;
  activatedAt: Date | null;
  createdAt: Date;
};

function toSafeRental(r: Rental): SafeRental {
  return {
    id: r.id,
    phoneId: r.phoneId,
    model: r.model,
    platform: r.platform,
    billingPeriod: r.billingPeriod,
    durationDays: r.durationDays,
    retailCents: r.retailCents,
    status: r.status,
    streamMintedAt: r.streamMintedAt,
    expiresAt: r.expiresAt,
    activatedAt: r.activatedAt,
    createdAt: r.createdAt,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rentals: SafeRental[] = [];
  if (isDbConfigured) {
    const rows = await listRentalsForUser(session.user.id);
    rentals = rows.map(toSafeRental);
  }

  return Response.json(
    {
      user: { id: session.user.id, email: session.user.email },
      rentals,
    },
    // Per-user data; keep it out of shared/browser caches.
    { headers: { "Cache-Control": "no-store" } },
  );
}
