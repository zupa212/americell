import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { adminDenied } from "@/lib/admin-billing";
import { updateMarginSettings } from "@/lib/pricing";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/admin/settings — set the reseller resale margin (owner-only).
 *
 * Persists the single-row `reseller_settings` config that `getMarginOpts()`
 * reads for BOTH the browse catalog and checkout, so the shown price always
 * equals the charged price. Re-checks `requireAdmin()` itself.
 */
const BodySchema = z.object({
  pct: z.number().int().min(0).max(1000), // markup over wholesale, %
  minCents: z.number().int().min(0).max(1_000_000), // min markup, cents
  rounding: z.enum(["whole", "psychological", "none"]),
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
    await updateMarginSettings(parsed.data, gate.session?.user?.email ?? undefined);
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.pricing_updated",
      targetType: "pricing",
      metadata: {
        pct: parsed.data.pct,
        minCents: parsed.data.minCents,
        rounding: parsed.data.rounding,
      },
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/settings] update failed:", (err as Error).message);
    return Response.json({ error: "Couldn't save pricing." }, { status: 500 });
  }
}
