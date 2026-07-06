import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { CellgodsError, deactivate } from "@/lib/cellgods";

/**
 * POST /api/admin/orders/deactivate — owner-only release of a CellGods order
 * (RESELLER_PLAN §6.3, §7.3).
 *
 * Deactivating releases the phone on CellGods; it NEVER refunds reseller credit
 * (refunds only ever happen on AMERICELL's own Stripe, never via
 * `/deactivate`). The gate is re-checked here (§6.1), the body is Zod-validated,
 * and CellGods failures are surfaced with the Greek status map (§6.3).
 *
 * Body: `{ order_id: string }` — the CellGods `order_id`, NOT an AMERICELL
 * rental id.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

const BodySchema = z.object({
  order_id: z.string().trim().min(1),
});

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

export async function POST(req: Request) {
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { error: GREEK_CELLGODS[400] },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: GREEK_CELLGODS[400] },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await deactivate(parsed.data.order_id);
    return Response.json(
      { ok: true, order_id: result.order_id, status: result.status },
      { headers: NO_STORE },
    );
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
