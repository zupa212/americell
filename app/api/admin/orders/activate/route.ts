import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import {
  CellgodsError,
  activate,
  isCellgodsConfigured,
} from "@/lib/cellgods";

/**
 * POST /api/admin/orders/activate — owner-only activation proxy (RESELLER_PLAN §6.3).
 *
 * Re-checks `requireAdmin()` itself, Zod-validates the body, then spends reseller
 * credit via `cellgods.activate`. The success payload contains `pin` +
 * `stream_url`, so every response is `Cache-Control: no-store`. On a
 * `CellgodsError` the wire status is translated to the Greek §6.3 map.
 *
 * NOTE: this is the admin/manual activation path. The customer money-path
 * activation happens exactly-once at webhook time (§7.2) — never here.
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

const ActivateBody = z.object({
  phone_id: z.string().min(1),
  customer_email: z.email(),
  duration_days: z.number().int().positive(),
  billing_period: z.enum(["daily", "weekly", "monthly"]),
});

export async function POST(req: Request) {
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { error: "Μη έγκυρο αίτημα" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = ActivateBody.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Μη έγκυρο αίτημα" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await activate(parsed.data);
    // Contains pin + stream_url — admin-only, never cached.
    return Response.json(result, { headers: NO_STORE });
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
