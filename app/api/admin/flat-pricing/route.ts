import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { adminDenied } from "@/lib/admin-billing";
import { updateFlatPricing } from "@/lib/pricing";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/admin/flat-pricing — set the fixed per-platform retail (owner-only).
 *
 * Persists the singleton `reseller_settings` flat fields that `getFlatPricing()`
 * reads for BOTH the browse catalog and checkout, so the shown price always
 * equals the charged price. Prices are integer cents (per month).
 */
const BodySchema = z.object({
  mode: z.enum(["flat", "margin"]),
  currency: z.string().trim().length(3),
  androidMonthlyCents: z.number().int().min(0).max(10_000_000),
  iphoneMonthlyCents: z.number().int().min(0).max(10_000_000),
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
    await updateFlatPricing(parsed.data, gate.session?.user?.email ?? undefined);
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.flat_pricing_updated",
      targetType: "pricing",
      metadata: parsed.data,
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/flat-pricing] update failed:", (err as Error).message);
    return Response.json({ error: "Couldn't save pricing." }, { status: 500 });
  }
}
