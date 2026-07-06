import { requireAdmin } from "@/lib/admin";
import { adminDenied, cellgodsErrorResponse } from "@/lib/admin-billing";
import { getBalance } from "@/lib/cellgods";

/**
 * GET /api/admin/balance — reseller credit balance + auto-topup config.
 *
 * Owner-only (RESELLER_PLAN §6.3, §7.5): re-checks `requireAdmin()` itself since
 * the `app/admin` layout gate doesn't run for route handlers. Financial data ⇒
 * `Cache-Control: no-store`.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.status !== 200) return adminDenied(gate.status);

  try {
    const balance = await getBalance();
    return Response.json(balance, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return cellgodsErrorResponse(err);
  }
}
