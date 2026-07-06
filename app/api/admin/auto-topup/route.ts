import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { adminDenied, cellgodsErrorResponse } from "@/lib/admin-billing";
import { setAutoTopup } from "@/lib/cellgods";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/admin/auto-topup — configure automatic reseller top-up
 * (RESELLER_PLAN §6.3). When the balance falls below `threshold_cents`, CellGods
 * auto-charges the card on file for `amount_cents`.
 *
 * Owner-only: re-checks `requireAdmin()` itself. Returns the updated auto-topup
 * config from CellGods.
 */
const BodySchema = z.object({
  enabled: z.boolean(),
  threshold_cents: z.number().int().min(0),
  amount_cents: z.number().int().min(0),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.status !== 200) return adminDenied(gate.status);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await setAutoTopup(parsed.data);
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.auto_topup",
      targetType: "balance",
      metadata: {
        enabled: parsed.data.enabled,
        threshold_cents: parsed.data.threshold_cents,
        amount_cents: parsed.data.amount_cents,
      },
    });
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return cellgodsErrorResponse(err);
  }
}
