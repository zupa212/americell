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

// Greek copy for CellGods failures (§6.3). Kept local so each admin route stays
// self-contained; `0` (transport error) and anything unmapped fall back to 500.
const GREEK_CELLGODS: Record<number, string> = {
  400: "Μη έγκυρο αίτημα",
  401: "Λείπει το κλειδί API",
  402: "Ανεπαρκές υπόλοιπο — πρόσθεσε πίστωση",
  403: "Μη έγκυρο κλειδί API",
  404: "Δεν βρέθηκε",
  409: "Η συσκευή δεν είναι πλέον διαθέσιμη",
  429: "Πολλά αιτήματα",
  500: "Σφάλμα διακομιστή",
};

export async function GET() {
  const gate = await requireAdmin();
  if (gate.status !== 200) {
    return Response.json(
      {
        error:
          gate.status === 401
            ? "Παρακαλώ συνδέσου για να συνεχίσεις."
            : "Δεν έχεις πρόσβαση.",
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
        { error: GREEK_CELLGODS[status] ?? GREEK_CELLGODS[500] },
        { status, headers: NO_STORE },
      );
    }
    return Response.json(
      { error: GREEK_CELLGODS[500] },
      { status: 500, headers: NO_STORE },
    );
  }
}
