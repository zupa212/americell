import { auth } from "@/auth";
import {
  CellgodsError,
  activate,
  getBalance,
  isCellgodsConfigured,
  type BillingPeriod,
} from "@/lib/cellgods";
import { encryptPin } from "@/lib/crypto";
import { getRentalForUser, refreshRentalSession } from "@/lib/rentals";
import { logEvent } from "@/lib/logs";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/rentals/[id]/refresh — RE-GRAB a live device's stream link.
 *
 * The upstream stream *session* (`iphone.devicecontrol.app`) expires ~hourly and
 * returns 403 "expired" even while the ORDER is still active — the black-screen /
 * "Control: Connecting…" symptom. Per CellGods (WaterProxy): the API token is
 * permanent, you "just regrab the links for the devices" — and the only reseller
 * call that returns a fresh `stream_url` is `/activate`. For a `pool` (prepaid)
 * device this re-mint charges nothing; the response's `charged_cents` is logged so
 * any wholesale spend (a `shared` device) is always auditable.
 *
 * Owner-gated (same ownership check as /pin & /stream) and hard rate-limited per
 * rental so a re-`activate` can never be spammed into a bill. Never returns the
 * PIN or stream URL to the client — on success the caller just re-opens
 * `/api/rentals/[id]/stream`, which now redirects to the freshly-stored link.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;
const ACTIVE = new Set(["active", "pooled"]);
const VALID_PERIODS = new Set<BillingPeriod>(["daily", "weekly", "monthly"]);

// A stuck customer legitimately retries a few times; cap hard because a re-mint of
// a *shared* device spends wholesale credit. Pool devices are free, so this only
// ever bites the (rare) shared case.
const REFRESH_MAX = 4;
const REFRESH_WINDOW_MS = 10 * 60 * 1000;

/** English copy for a `CellgodsError.status`; status 0 (network) → generic. */
const CELLGODS_STATUS_EN: Record<number, string> = {
  400: "Invalid request",
  401: "Missing API key",
  402: "Insufficient balance — please contact support",
  403: "Invalid API key",
  404: "This device is no longer available",
  409: "This device is no longer available",
  429: "Too many requests — please wait a moment",
  500: "Server error",
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }

  const { id } = await params;
  const rental = await getRentalForUser(id, session.user.id);
  if (!rental) {
    return Response.json(
      { error: "Forbidden" },
      { status: 403, headers: NO_STORE },
    );
  }
  if (!ACTIVE.has(rental.status)) {
    return Response.json(
      { error: "This rental isn't active." },
      { status: 409, headers: NO_STORE },
    );
  }
  if (!isCellgodsConfigured) {
    return Response.json(
      { error: "Live device backend isn't configured." },
      { status: 503, headers: NO_STORE },
    );
  }

  const rl = rateLimit(`refresh:${rental.id}`, REFRESH_MAX, REFRESH_WINDOW_MS);
  if (!rl.ok) {
    return Response.json(
      { error: "Please wait a moment before reconnecting again." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Stored as free-text; only forward it to /activate if it's a real period.
  const billing_period = VALID_PERIODS.has(rental.billingPeriod as BillingPeriod)
    ? (rental.billingPeriod as BillingPeriod)
    : undefined;

  // Balance snapshot so any wholesale spend on a re-mint is visible in the audit
  // trail (best-effort — a balance read failure must never block the reconnect).
  let balanceBefore: number | null = null;
  try {
    balanceBefore = (await getBalance()).credit_balance_cents;
  } catch {
    /* non-fatal */
  }

  try {
    const result = await activate({
      phone_id: rental.phoneId,
      customer_email: rental.customerEmail,
      duration_days: rental.durationDays,
      billing_period,
    });

    await refreshRentalSession(rental.id, {
      cellgodsOrderId: result.order_id,
      streamUrl: result.stream_url,
      pinCiphertext: encryptPin(result.pin),
      expiresAt: new Date(result.expires_at),
    });

    let balanceAfter: number | null = null;
    try {
      balanceAfter = (await getBalance()).credit_balance_cents;
    } catch {
      /* non-fatal */
    }
    const balanceDelta =
      balanceBefore != null && balanceAfter != null
        ? balanceAfter - balanceBefore
        : null;

    // Audit: link re-grabbed. Never logs pin/stream_url; records any wholesale spend.
    await logEvent({
      actorType: "customer",
      actorEmail: session.user.email,
      actorId: session.user.id,
      action: "device.stream_refreshed",
      targetType: "rental",
      targetId: rental.id,
      metadata: {
        model: rental.model,
        order_id: result.order_id,
        charged_cents: result.charged_cents,
        balance_delta_cents: balanceDelta,
      },
    });

    if (result.charged_cents > 0) {
      console.warn(
        `[rentals/refresh] re-mint charged wholesale: rental=${rental.id} charged_cents=${result.charged_cents}`,
      );
    }

    return Response.json({ ok: true }, { headers: NO_STORE });
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
