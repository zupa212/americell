import * as z from "zod";

import { requireAdmin } from "@/lib/admin";
import {
  CellgodsError,
  activate,
  getInventory,
  isCellgodsConfigured,
} from "@/lib/cellgods";
import { logEvent } from "@/lib/logs";
import { getUserByEmail } from "@/lib/users";
import { encryptPin } from "@/lib/crypto";
import { insertActiveRental } from "@/lib/rentals";

/**
 * POST /api/admin/orders/activate — owner-only activation proxy (RESELLER_PLAN §6.3).
 *
 * Re-checks `requireAdmin()` itself, Zod-validates the body, then spends reseller
 * credit via `cellgods.activate`. The success payload contains `pin` +
 * `stream_url`, so every response is `Cache-Control: no-store`. On a
 * `CellgodsError` the wire status is translated to the English §6.3 map.
 *
 * NOTE: this is the admin/manual activation path. The customer money-path
 * activation happens exactly-once at webhook time (§7.2) — never here.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** English copy for a `CellgodsError.status` (RESELLER_PLAN §6.3); status 0 (network) → generic. */
const CELLGODS_STATUS_EN: Record<number, string> = {
  400: "Invalid request",
  401: "Missing API key",
  402: "Insufficient balance — add credit",
  403: "Invalid API key",
  404: "Not found",
  409: "Device is no longer available",
  429: "Too many requests",
  500: "Server error",
};

const ActivateBody = z.object({
  phone_id: z.string().min(1),
  customer_email: z.email(),
  duration_days: z.number().int().positive(),
  billing_period: z.enum(["daily", "weekly", "monthly"]),
  // Optional sale price to record for the rental (e.g. €250 = 25000). Absent →
  // falls back to the wholesale actually charged.
  retail_cents: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.status !== 200) {
    return Response.json(
      {
        error:
          gate.status === 401
            ? "Please sign in."
            : "You don't have access.",
      },
      { status: gate.status, headers: NO_STORE },
    );
  }

  if (!isCellgodsConfigured) {
    return Response.json(
      { error: "Missing API key" },
      { status: 503, headers: NO_STORE },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid request" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = ActivateBody.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await activate(parsed.data);
    // Best-effort audit trail (never logs pin/stream_url); never blocks/breaks.
    await logEvent({
      actorType: "admin",
      actorEmail: gate.session?.user?.email,
      action: "admin.activate",
      targetType: "order",
      targetId: result.order_id,
      metadata: {
        phone_id: parsed.data.phone_id,
        customer_email: parsed.data.customer_email,
        duration_days: parsed.data.duration_days,
        charged_cents: result.charged_cents,
        retail_cents: parsed.data.retail_cents ?? null,
      },
    });

    // Best-effort bookkeeping: mirror the manual activation as an ACTIVE rental so
    // it appears in the customer's dashboard AND the admin book (with the PIN +
    // stream so their Control page works). NEVER fails the activation response —
    // the device is already provisioned; a bookkeeping error just logs.
    try {
      const user = await getUserByEmail(parsed.data.customer_email);
      if (user) {
        const inventory = await getInventory().catch(() => []);
        const item = inventory.find((p) => p.phone_id === parsed.data.phone_id);
        await insertActiveRental({
          userId: user.id,
          customerEmail: parsed.data.customer_email,
          phoneId: parsed.data.phone_id,
          model: item?.model ?? parsed.data.phone_id,
          platform: item?.type ?? "iphone",
          billingPeriod: parsed.data.billing_period,
          durationDays: parsed.data.duration_days,
          retailCents: parsed.data.retail_cents ?? result.charged_cents,
          chargedCents: result.charged_cents,
          cellgodsOrderId: result.order_id,
          pinCiphertext: encryptPin(result.pin),
          streamUrl: result.stream_url,
          expiresAt: new Date(result.expires_at),
        });
      }
    } catch (err) {
      console.error("[admin/activate] rental record insert failed", err);
    }

    // Contains pin + stream_url — admin-only, never cached.
    return Response.json(result, { headers: NO_STORE });
  } catch (e) {
    if (e instanceof CellgodsError) {
      const status = e.status || 500;
      return Response.json(
        { error: CELLGODS_STATUS_EN[status] ?? "Server error" },
        { status, headers: NO_STORE },
      );
    }
    return Response.json(
      { error: "Server error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
