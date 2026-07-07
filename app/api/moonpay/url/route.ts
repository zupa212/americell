import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { getBalance, getInventory, isCellgodsConfigured } from "@/lib/cellgods";
import { DURATIONS, toPublicRetailPhone, wholesaleFor } from "@/lib/pricing";
import { attachSession, createPendingRental } from "@/lib/rentals";
import { buildMoonpayUrl, isMoonpayConfigured } from "@/lib/moonpay";
import { logEvent } from "@/lib/logs";

/**
 * Crypto checkout via MoonPay — the same server-priced, credit-preflighted,
 * pending-rental flow as /api/checkout, but instead of a Stripe session it
 * returns a signed MoonPay widget URL. The webhook activates on settlement.
 * Money is integer cents; the client only sends { phoneId, period }.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) {
    return Response.json({ error: "Please log in to continue." }, { status: 401 });
  }

  if (!isMoonpayConfigured || !isCellgodsConfigured || !isDbConfigured) {
    return Response.json(
      { error: "Crypto payments are in demo mode — not configured yet.", demo: true },
      { status: 503 },
    );
  }

  let body: { phoneId?: string; period?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let inventory;
  try {
    inventory = await getInventory();
  } catch {
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
  }
  const item = inventory.find((p) => p.phone_id === body.phoneId);
  if (!item) return Response.json({ error: "Unknown device." }, { status: 400 });
  if (item.status !== "available") {
    return Response.json({ error: "That device was just reserved." }, { status: 409 });
  }

  const duration = DURATIONS.find((d) => d.period === body.period);
  if (!duration) return Response.json({ error: "Invalid period." }, { status: 400 });

  const wholesale = wholesaleFor(item, duration.period);
  const retailCents = toPublicRetailPhone(item).retail[duration.period];
  if (retailCents < wholesale) {
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
  }

  // Fulfilment preflight: never take a payment we can't fulfil from credit.
  let balance;
  try {
    balance = await getBalance();
  } catch {
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
  }
  if (balance.credit_balance_cents < wholesale) {
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
  }

  const rental = await createPendingRental({
    userId,
    customerEmail: email,
    phoneId: item.phone_id,
    model: item.model,
    platform: item.type,
    billingPeriod: duration.period,
    durationDays: duration.days,
    wholesaleQuotedCents: wholesale,
    retailCents,
  });
  // The rental id is the idempotency key; bind a unique MoonPay-scoped ref.
  await attachSession(rental.id, `moonpay_${randomUUID()}`);

  await logEvent({
    actorType: "customer",
    actorEmail: email,
    actorId: userId,
    action: "checkout.started",
    targetType: "rental",
    targetId: rental.id,
    metadata: { phoneId: item.phone_id, period: duration.period, retailCents, method: "moonpay" },
  });

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const url = buildMoonpayUrl({
    amountUsd: retailCents / 100,
    externalTransactionId: rental.id,
    email,
    redirectUrl: `${origin}/dashboard?crypto=success`,
  });

  return Response.json({ url });
}
