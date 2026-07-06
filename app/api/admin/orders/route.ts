import { requireAdmin } from "@/lib/admin";
import { CellgodsError, getOrders } from "@/lib/cellgods";

/**
 * GET /api/admin/orders — owner-only list of live CellGods orders
 * (RESELLER_PLAN §6.3).
 *
 * Read-only proxy: `requireAdmin()` FIRST (layouts don't run for route
 * handlers, so this handler re-checks the owner gate itself), then straight
 * through to `lib/cellgods.getOrders`. The CellGods API key never leaves the
 * server. Responses are `no-store` — order status/expiry are live, never cached.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

// English copy for CellGods failures (§6.3). Kept local so each admin route stays
// self-contained; `0` (transport error) and anything unmapped fall back to 500.
const CELLGODS_MESSAGES: Record<number, string> = {
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
            ? "Please sign in to continue."
            : "You don't have access.",
      },
      { status: gate.status, headers: NO_STORE },
    );
  }

  try {
    const orders = await getOrders();
    return Response.json({ orders }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof CellgodsError) {
      const status = err.status || 500;
      return Response.json(
        { error: CELLGODS_MESSAGES[status] ?? CELLGODS_MESSAGES[500] },
        { status, headers: NO_STORE },
      );
    }
    return Response.json(
      { error: CELLGODS_MESSAGES[500] },
      { status: 500, headers: NO_STORE },
    );
  }
}
