import { requireAdmin } from "@/lib/admin";
import {
  CellgodsError,
  getInventory,
  isCellgodsConfigured,
} from "@/lib/cellgods";

/**
 * GET /api/admin/inventory — owner-only live inventory proxy (RESELLER_PLAN §6.3).
 *
 * The browser never sees `CELLGODS_API_KEY`; this handler re-checks
 * `requireAdmin()` itself (layouts don't run for route handlers) and forwards to
 * CellGods server-side. Response carries wholesale `price_*` cents, so it is
 * admin-only and never cached.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** English copy for a `CellgodsError.status` (RESELLER_PLAN §6.3); status 0 (network) → generic. */
const CELLGODS_STATUS_EN: Record<number, string> = {
  400: "Invalid request",
  401: "Missing API key",
  402: "Insufficient balance — add credit",
  403: "Invalid API key",
  404: "Not found",
  409: "Device is no longer available",
  429: "Too many requests",
  500: "Server error",
};

export async function GET() {
  const gate = await requireAdmin();
  if (gate.status !== 200) {
    return Response.json(
      {
        error:
          gate.status === 401
            ? "Please sign in."
            : "You don't have access.",
      },
      { status: gate.status, headers: NO_STORE },
    );
  }

  if (!isCellgodsConfigured) {
    return Response.json(
      { error: "Missing API key" },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const inventory = await getInventory();
    return Response.json({ inventory }, { headers: NO_STORE });
  } catch (e) {
    if (e instanceof CellgodsError) {
      const status = e.status || 500;
      return Response.json(
        { error: CELLGODS_STATUS_EN[status] ?? "Server error" },
        { status, headers: NO_STORE },
      );
    }
    return Response.json(
      { error: "Server error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
