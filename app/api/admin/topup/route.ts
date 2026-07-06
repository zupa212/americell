import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import { adminDenied, cellgodsErrorResponse } from "@/lib/admin-billing";
import { topup } from "@/lib/cellgods";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/admin/topup — start a CellGods hosted Stripe Checkout that funds the
 * reseller credit balance (RESELLER_PLAN §1.2, §6.3). This is the CellGods
 * Stripe surface — NOT the customer retail surface — so it must never be
 * conflated with `/api/checkout`.
 *
 * Owner-only: re-checks `requireAdmin()` itself. Body is only `{ amount_cents }`
 * (min 500 = $5); the success/cancel URLs are injected server-side from the
 * request origin so the client can't redirect the post-payment flow elsewhere.
 * Returns `{ checkout_url }` for the browser to navigate to.
 */
const BodySchema = z.object({
  amount_cents: z.number().int().min(500),
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

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  try {
    const result = await topup({
      amount_cents: parsed.data.amount_cents,
      success_url: `${origin}/admin/billing?topup=success`,
      cancel_url: `${origin}/admin/billing?topup=cancel`,
    });
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.topup",
      targetType: "balance",
      metadata: { amount_cents: parsed.data.amount_cents },
    });
    return Response.json(
      { checkout_url: result.checkout_url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return cellgodsErrorResponse(err);
  }
}
