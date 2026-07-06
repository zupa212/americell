import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { CellgodsError, deactivate } from "@/lib/cellgods";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/admin/orders/deactivate — owner-only release of a CellGods order
 * (RESELLER_PLAN §6.3, §7.3).
 *
 * Deactivating releases the phone on CellGods; it NEVER refunds reseller credit
 * (refunds only ever happen on AMERICELL's own Stripe, never via
 * `/deactivate`). The gate is re-checked here (§6.1), the body is Zod-validated,
 * and CellGods failures are surfaced with the English status map (§6.3).
 *
 * Body: `{ order_id: string }` — the CellGods `order_id`, NOT an AMERICELL
 * rental id.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

const BodySchema = z.object({
  order_id: z.string().trim().min(1),
});

// English copy for CellGods failures (§6.3). Kept local so each admin route stays
// self-contained; `0` (transport error) and anything unmapped fall back to 500.
const CELLGODS_MESSAGES: Record<number, string> = {
  400: "Invalid request",
  401: "Missing API key",
  402: "Insufficient balance — add credit",
  403: "Invalid API key",
  404: "Not found",
  409: "Device is no longer available",
  429: "Too many requests",
  500: "Server error",
};

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.status !== 200) {
    return Response.json(
      {
        error:
          gate.status === 401
            ? "Please sign in to continue."
            : "You don't have access.",
      },
      { status: gate.status, headers: NO_STORE },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { error: CELLGODS_MESSAGES[400] },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: CELLGODS_MESSAGES[400] },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await deactivate(parsed.data.order_id);
    // Best-effort audit trail; never blocks/breaks the release path.
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.deactivate",
      targetType: "order",
      targetId: result.order_id,
      metadata: { order_id: result.order_id },
    });
    return Response.json(
      { ok: true, order_id: result.order_id, status: result.status },
      { headers: NO_STORE },
    );
  } catch (err) {
    if (err instanceof CellgodsError) {
      const status = err.status || 500;
      return Response.json(
        { error: CELLGODS_MESSAGES[status] ?? CELLGODS_MESSAGES[500] },
        { status, headers: NO_STORE },
      );
    }
    return Response.json(
      { error: CELLGODS_MESSAGES[500] },
      { status: 500, headers: NO_STORE },
    );
  }
}
