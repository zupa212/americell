import "server-only";

import { CellgodsError } from "@/lib/cellgods";

/**
 * Shared HTTP helpers for the admin BILLING route handlers
 * (`/api/admin/{balance,ledger,topup,auto-topup}`), per RESELLER_PLAN §6.3.
 *
 * Kept in its own module (not `lib/admin.ts`) so the billing slice owns it
 * outright and stays self-contained.
 */

// Greek status map for CellGods failures (RESELLER_PLAN §6.3).
const CELLGODS_MESSAGES: Record<number, string> = {
  400: "Μη έγκυρο αίτημα",
  401: "Λείπει το κλειδί API",
  402: "Ανεπαρκές υπόλοιπο — πρόσθεσε πίστωση",
  403: "Μη έγκυρο κλειδί API",
  404: "Δεν βρέθηκε",
  409: "Η συσκευή δεν είναι πλέον διαθέσιμη",
  429: "Πολλά αιτήματα",
  500: "Σφάλμα διακομιστή",
};

/**
 * Deny Response for a failed `requireAdmin()`:
 *  - 401 → "unauthenticated"
 *  - 403 → surfaced as **404** so the admin API's existence isn't leaked to a
 *    signed-in non-owner (mirrors the page-level `notFound()`).
 */
export function adminDenied(status: 401 | 403): Response {
  if (status === 401) {
    return Response.json(
      { error: "Μη εξουσιοδοτημένη πρόσβαση." },
      { status: 401 },
    );
  }
  return Response.json({ error: "Δεν βρέθηκε." }, { status: 404 });
}

/**
 * Map a thrown CellGods error to a Greek JSON Response carrying the upstream
 * status. A `status === 0` (network/timeout/unconfigured) becomes a 503 so we
 * never emit a nonsensical HTTP 0.
 */
export function cellgodsErrorResponse(err: unknown): Response {
  if (err instanceof CellgodsError) {
    const status = err.status && err.status >= 400 ? err.status : 503;
    const message =
      CELLGODS_MESSAGES[err.status] ?? "Προσωρινά μη διαθέσιμο — δοκίμασε ξανά.";
    return Response.json({ error: message }, { status });
  }
  return Response.json({ error: "Σφάλμα διακομιστή." }, { status: 500 });
}
