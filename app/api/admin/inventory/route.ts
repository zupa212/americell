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

/** Greek copy for a `CellgodsError.status` (RESELLER_PLAN §6.3); status 0 (network) → generic. */
const CELLGODS_STATUS_EL: Record<number, string> = {
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
            ? "Παρακαλώ συνδέσου."
            : "Δεν έχεις πρόσβαση.",
      },
      { status: gate.status, headers: NO_STORE },
    );
  }

  if (!isCellgodsConfigured) {
    return Response.json(
      { error: "Λείπει το κλειδί API" },
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
        { error: CELLGODS_STATUS_EL[status] ?? "Σφάλμα διακομιστή" },
        { status, headers: NO_STORE },
      );
    }
    return Response.json(
      { error: "Σφάλμα διακομιστή" },
      { status: 500, headers: NO_STORE },
    );
  }
}
