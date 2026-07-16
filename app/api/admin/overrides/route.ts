import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { adminDenied } from "@/lib/admin-billing";
import { clearDeviceOverride, setDeviceOverride } from "@/lib/pricing";
import { logEvent } from "@/lib/logs";

/**
 * Per-device markup overrides (owner-only). POST upserts an override for a
 * `phoneId`; DELETE removes it (the device falls back to the global markup).
 * Both browse and checkout read these via `resolveMarginOpts`, so shown = charged.
 */
const SetSchema = z.object({
  phoneId: z.string().min(1).max(200),
  pct: z.number().int().min(0).max(1000),
});
const DelSchema = z.object({ phoneId: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.status !== 200) return adminDenied(gate.status);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = SetSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await setDeviceOverride(
      parsed.data.phoneId,
      parsed.data.pct,
      gate.session?.user?.email ?? undefined,
    );
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.device_override_set",
      targetType: "phone",
      targetId: parsed.data.phoneId,
      metadata: { pct: parsed.data.pct },
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/overrides] set failed:", (err as Error).message);
    return Response.json({ error: "Couldn't save the override." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (gate.status !== 200) return adminDenied(gate.status);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = DelSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await clearDeviceOverride(parsed.data.phoneId);
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.device_override_cleared",
      targetType: "phone",
      targetId: parsed.data.phoneId,
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/overrides] clear failed:", (err as Error).message);
    return Response.json({ error: "Couldn't remove the override." }, { status: 500 });
  }
}
