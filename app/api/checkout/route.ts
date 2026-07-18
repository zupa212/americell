import { auth } from "@/auth";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { isDbConfigured } from "@/lib/db";
import { getBalance, getInventory, isCellgodsConfigured } from "@/lib/cellgods";
import { DURATIONS, priceForCheckout } from "@/lib/pricing";
import { attachSession, createPendingRental } from "@/lib/rentals";
import { logEvent } from "@/lib/logs";
import { isAdminEmail } from "@/lib/admin";

/**
 * Customer purchase — reseller flow B (RESELLER_PLAN §5.5).
 *
 * One-time RETAIL payment (`mode:"payment"`) for a fixed-duration CellGods
 * rental — NOT a recurring subscription. Body is only `{ phoneId, period }`;
 * the price is computed server-side from LIVE wholesale inventory so the client
 * can never dictate what it pays. A pending `rentals` row is created up front;
 * the webhook (§7.2) is what actually activates and mints the PIN/stream URL.
 *
 * Money is ALWAYS integer cents.
 */
export async function POST(req: Request) {
  // 1. Auth. No session (or no provisioning email) ⇒ 401.
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) {
    return Response.json(
      { error: "Please log in to continue." },
      { status: 401 },
    );
  }
  // Owners get the real block reason in the response (customers get the neutral
  // white-label message, so the reseller model never leaks).
  const owner = isAdminEmail(email);
  const eur = (c: number) => `€${(c / 100).toFixed(2)}`;
  const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

  // Fail closed: retail Stripe + CellGods + DB must all be configured, else demo.
  if (!isStripeConfigured || !stripe || !isCellgodsConfigured || !isDbConfigured) {
    return Response.json(
      {
        error: "Payments are in demo mode — not set up yet.",
        demo: true,
      },
      { status: 503 },
    );
  }

  let body: { phoneId?: string; period?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // 2. Live inventory → find the phone; enforce availability at buy time.
  let inventory;
  try {
    inventory = await getInventory();
  } catch {
    return Response.json(
      { error: "Temporarily unavailable." },
      { status: 503 },
    );
  }

  const item = inventory.find((p) => p.phone_id === body.phoneId);
  if (!item) {
    return Response.json({ error: "Unknown device." }, { status: 400 });
  }
  if (item.status !== "available") {
    return Response.json(
      { error: "That device was just reserved." },
      { status: 409 },
    );
  }

  // 3. Duration + pricing (integer cents). Retail is computed server-side and
  //    matches the browse price exactly; invariant: retail >= wholesale.
  const duration = DURATIONS.find((d) => d.period === body.period);
  if (!duration) {
    return Response.json({ error: "Invalid period." }, { status: 400 });
  }
  const period = duration.period;
  const durationDays = duration.days;

  // ONE price resolver shared by every payment path (shown == charged).
  const { retailCents, currency, wholesale, supported } = await priceForCheckout(
    item,
    period,
  );
  // Money-safety: refuse a duration the device doesn't actually offer at CellGods.
  if (!supported) {
    return Response.json(
      { error: "This duration isn't available for this device." },
      { status: 400 },
    );
  }
  // Owners bypass the money-safety guards to test the payment flow end-to-end
  // (e.g. a €1 test charge). Real customers are always protected.
  if (retailCents < wholesale && !owner) {
    // Defensive money-safety guard — must never sell below cost.
    console.error(
      `[checkout] retail<wholesale for ${item.phone_id}/${period}: ${retailCents} < ${wholesale}`,
    );
    return Response.json(
      {
        error: "Temporarily unavailable.",
        ...(owner && {
          reason: `Retail ${eur(retailCents)} would be below wholesale ${usd(wholesale)} for this ${period} — refusing to sell below cost.`,
        }),
      },
      { status: 503 },
    );
  }

  // 4. Fulfilment preflight: only shared-pool activations spend credit at
  //    activation time. Pool devices are pre-paid, so skip the credit gate —
  //    they sell even at $0 balance.
  const prePaid = item.source === "pool";
  if (!prePaid && !owner) {
    let balance;
    try {
      balance = await getBalance();
    } catch {
      return Response.json(
        {
          error: "Temporarily unavailable.",
          ...(owner && { reason: "Couldn't reach CellGods to read your credit balance." }),
        },
        { status: 503 },
      );
    }
    if (balance.credit_balance_cents < wholesale) {
      console.warn(
        `[checkout] low reseller credit: balance=${balance.credit_balance_cents} < wholesale=${wholesale}`,
      );
      return Response.json(
        {
          error: "Temporarily unavailable.",
          ...(owner && {
            reason: `Low CellGods credit: you have ${usd(balance.credit_balance_cents)}, but this ${period} needs ${usd(wholesale)} wholesale. Top up your CellGods balance (or use a pre-paid pool device).`,
          }),
        },
        { status: 503 },
      );
    }
  }

  // 5. Snapshot the rental (pending_payment). wholesale + retail are frozen here.
  const rental = await createPendingRental({
    userId,
    customerEmail: email,
    phoneId: item.phone_id,
    model: item.model,
    platform: item.type,
    billingPeriod: period,
    durationDays,
    wholesaleQuotedCents: wholesale,
    retailCents,
  });

  // Audit: pending rental snapshot created (best-effort, never blocks checkout).
  await logEvent({
    actorType: "customer",
    actorEmail: email,
    actorId: userId,
    action: "checkout.started",
    targetType: "rental",
    targetId: rental.id,
    metadata: { phoneId: item.phone_id, period, retailCents },
  });

  // 6. One-time RETAIL Stripe Checkout (inline price_data in cents). No
  //    `recurring`, no `subscription_data` — this is `mode:"payment"`.
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const successUrl =
    process.env.CHECKOUT_SUCCESS_URL ?? `${origin}/dashboard?checkout=success`;
  const cancelUrl = process.env.CHECKOUT_CANCEL_URL ?? `${origin}/dashboard?tab=rent`;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          product_data: {
            name: `Americell — ${item.model} (${duration.label})`,
          },
          unit_amount: retailCents,
        },
      },
    ],
    client_reference_id: userId,
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      rentalId: rental.id,
      userId,
      phoneId: item.phone_id,
      period,
      durationDays: String(durationDays),
    },
    payment_intent_data: { metadata: { rentalId: rental.id } },
  });

  // 7. Bind the Stripe session id to the rental (webhook idempotency key).
  await attachSession(rental.id, checkout.id);

  return Response.json({ url: checkout.url });
}
