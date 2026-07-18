import { auth } from "@/auth";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { isDbConfigured } from "@/lib/db";
import { getBalance, getInventory, isCellgodsConfigured } from "@/lib/cellgods";
import { DURATIONS, priceForCheckout } from "@/lib/pricing";
import { attachSession, createPendingRental } from "@/lib/rentals";
import { logEvent } from "@/lib/logs";
import { isAdminEmail } from "@/lib/admin";
import { rentalRef } from "@/lib/rental-ref";

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

  // Owner test price: when OWNER_TEST_PRICE_CENTS is set, owners (admins) are
  // charged that flat amount on ANY period — customer/public prices are NEVER
  // touched — so we can run a cheap end-to-end test. Off unless the env is set.
  const testCents = Math.trunc(Number(process.env.OWNER_TEST_PRICE_CENTS));
  const ownerTest = owner && Number.isFinite(testCents) && testCents > 0;
  // What Stripe actually charges + what we snapshot on the rental (shown==charged).
  const chargeCents = ownerTest ? testCents : retailCents;

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
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
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
      return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
    }
    if (balance.credit_balance_cents < wholesale) {
      console.warn(
        `[checkout] low reseller credit: balance=${balance.credit_balance_cents} < wholesale=${wholesale}`,
      );
      return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
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
    retailCents: chargeCents,
  });

  // Human-readable order reference (AMC-XXXXXXXX) derived from the rental UUID.
  // Surfaced on the Stripe product/receipt AND the admin table via the SAME
  // rentalRef() helper, so what the customer sees == what the admin sees.
  const ref = rentalRef(rental.id);

  // Audit: pending rental snapshot created (best-effort, never blocks checkout).
  await logEvent({
    actorType: "customer",
    actorEmail: email,
    actorId: userId,
    action: "checkout.started",
    targetType: "rental",
    targetId: rental.id,
    metadata: { phoneId: item.phone_id, period, retailCents: chargeCents, orderRef: ref, ownerTest },
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

  const platformLabel = item.type === "iphone" ? "iPhone" : "Android";
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          product_data: {
            name: `Americell — ${item.model} (${duration.label})${ownerTest ? " · TEST" : ""}`,
            description: `Order ${ref} · ${duration.label} rental · real US ${platformLabel}, US SIM & data included`,
          },
          unit_amount: chargeCents,
        },
      },
    ],
    client_reference_id: userId,
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Let customers enter a Stripe promotion code (e.g. AMERICELL50 = €50 off) at
    // checkout. Create the coupon + promo code in the Stripe Dashboard; the
    // discount applies to the session total (works with inline price_data).
    allow_promotion_codes: true,
    // Professional touch: a submit-side note so the buyer knows what lands next.
    custom_text: {
      submit: {
        message:
          "You'll get your device PIN and a secure live-control link on your dashboard the moment payment clears.",
      },
    },
    metadata: {
      rentalId: rental.id,
      transactionRef: ref,
      userId,
      phoneId: item.phone_id,
      period,
      durationDays: String(durationDays),
    },
    // receipt_email triggers Stripe's branded email receipt (logo comes from
    // Stripe → Settings → Branding). description shows the order ref on the
    // charge/receipt. rentalId is kept for webhook lookups (idempotency).
    payment_intent_data: {
      description: `${ref} — ${item.model} (${duration.label})`,
      receipt_email: email,
      metadata: { rentalId: rental.id, transactionRef: ref },
    },
  });

  // 7. Bind the Stripe session id to the rental (webhook idempotency key).
  await attachSession(rental.id, checkout.id);

  return Response.json({ url: checkout.url });
}
