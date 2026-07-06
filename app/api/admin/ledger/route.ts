import { requireAdmin } from "@/lib/admin";
import { adminDenied, cellgodsErrorResponse } from "@/lib/admin-billing";
import { getLedger } from "@/lib/cellgods";

/**
 * GET /api/admin/ledger — reseller credit ledger (debits/credits over time).
 *
 * Owner-only (RESELLER_PLAN §6.3, §7.5): re-checks `requireAdmin()` itself.
 * Financial data ⇒ `Cache-Control: no-store`.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.status !== 200) return adminDenied(gate.status);

  try {
    const ledger = await getLedger();
    return Response.json(ledger, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return cellgodsErrorResponse(err);
  }
}
