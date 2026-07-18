import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { getBalance, getInventory, isCellgodsConfigured } from "@/lib/cellgods";
import { DURATIONS, priceForCheckout } from "@/lib/pricing";
import { CRYPTO_ENABLED } from "@/lib/features";
import { attachSession, createPendingRental } from "@/lib/rentals";
import { logEvent } from "@/lib/logs";
import { isAdminEmail } from "@/lib/admin";
import { buildMoonpayUrl, isMoonpayConfigured } from "@/lib/moonpay";
import { createNowpaymentsInvoice, isNowpaymentsConfigured } from "@/lib/nowpayments";
import { createCoinbaseCharge, isCoinbaseConfigured } from "@/lib/coinbase";
import { createBtcpayInvoice, isBtcpayConfigured } from "@/lib/btcpay";
import { rentalRef } from "@/lib/rental-ref";
import { couponDiscountCents, findCoupon } from "@/lib/coupons";

type Provider = "moonpay" | "nowpayments" | "coinbase" | "btcpay";

/**
 * Unified crypto checkout. Same server-priced, credit-preflighted, pending-rental
 * flow as Stripe/MoonPay, but dispatches to the chosen crypto provider and
 * returns its hosted payment URL. The client only sends { phoneId, period, provider }.
 */
export async function POST(req: Request) {
  if (!CRYPTO_ENABLED) {
    return Response.json(
      { error: "Crypto payments are temporarily unavailable." },
      { status: 503 },
    );
  }
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) {
    return Response.json({ error: "Please log in to continue." }, { status: 401 });
  }
  const owner = isAdminEmail(email); // owners bypass money-safety guards to test

  let body: { phoneId?: string; period?: string; provider?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const provider = body.provider as Provider;
  const configured: Record<Provider, boolean> = {
    moonpay: isMoonpayConfigured,
    nowpayments: isNowpaymentsConfigured,
    coinbase: isCoinbaseConfigured,
    btcpay: isBtcpayConfigured,
  };
  if (!provider || !(provider in configured)) {
    return Response.json({ error: "Unknown crypto provider." }, { status: 400 });
  }
  if (!configured[provider] || !isCellgodsConfigured || !isDbConfigured) {
    return Response.json(
      { error: "Crypto payments are in demo mode — not configured yet.", demo: true },
      { status: 503 },
    );
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

  // Same price resolver as Stripe checkout + browse (shown == charged).
  const { retailCents, currency, wholesale, supported } = await priceForCheckout(
    item,
    duration.period,
  );

  // Owner test price mirror (see card /api/checkout): when OWNER_TEST_PRICE_CENTS
  // is set, admins pay that flat amount on any period; customer prices untouched.
  const testCents = Math.trunc(Number(process.env.OWNER_TEST_PRICE_CENTS));
  const ownerTest = owner && Number.isFinite(testCents) && testCents > 0;
  // Coupon discount (crypto's own promo layer, mirrors the Stripe promo code).
  const discountCents = couponDiscountCents(body.code, retailCents, currency);
  const chargeCents = ownerTest
    ? testCents
    : Math.max(50, retailCents - discountCents);

  if (!supported) {
    return Response.json(
      { error: "This duration isn't available for this device." },
      { status: 400 },
    );
  }
  if (retailCents < wholesale && !owner) {
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
  }

  // Pool devices are pre-paid — skip the credit gate; only shared-pool
  // activations spend credit at activation time. Owners bypass to test.
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
        `[crypto-checkout] low reseller credit: balance=${balance.credit_balance_cents} < wholesale=${wholesale}`,
      );
      return Response.json(
        { error: "Temporarily unavailable." },
        { status: 503 },
      );
    }
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
    retailCents: chargeCents,
  });
  await attachSession(rental.id, `${provider}_${randomUUID()}`);

  // Same human-readable order reference as the card flow (from the rental UUID).
  const ref = rentalRef(rental.id);

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const amountUsd = chargeCents / 100;
  const description = `Order ${ref} — Americell ${item.model} (${duration.label})`;

  let url: string;
  try {
    if (provider === "moonpay") {
      url = buildMoonpayUrl({
        amountUsd,
        currency,
        externalTransactionId: rental.id,
        email,
        redirectUrl: `${origin}/dashboard?crypto=success`,
      });
    } else if (provider === "nowpayments") {
      ({ url } = await createNowpaymentsInvoice({
        amountUsd,
        currency,
        orderId: rental.id,
        description,
        ipnUrl: `${origin}/api/nowpayments/webhook`,
        successUrl: `${origin}/dashboard?crypto=success`,
        cancelUrl: `${origin}/dashboard?tab=rent`,
      }));
    } else if (provider === "btcpay") {
      ({ url } = await createBtcpayInvoice({
        amountUsd,
        currency,
        orderId: rental.id,
        description,
        redirectUrl: `${origin}/dashboard?crypto=success`,
      }));
    } else {
      ({ url } = await createCoinbaseCharge({
        amountUsd,
        currency,
        rentalId: rental.id,
        name: `Americell rental · ${ref}`,
        description,
        redirectUrl: `${origin}/dashboard?crypto=success`,
        cancelUrl: `${origin}/dashboard?tab=rent`,
      }));
    }
  } catch (e) {
    console.error(`[crypto] ${provider} URL failed:`, (e as Error).message);
    return Response.json({ error: "Couldn't start crypto checkout. Please try again." }, { status: 502 });
  }

  await logEvent({
    actorType: "customer",
    actorEmail: email,
    actorId: userId,
    action: "checkout.started",
    targetType: "rental",
    targetId: rental.id,
    metadata: { phoneId: item.phone_id, period: duration.period, retailCents: chargeCents, method: provider, orderRef: ref, ownerTest, couponCode: discountCents > 0 ? findCoupon(body.code)?.code : undefined },
  });

  return Response.json({ url });
}
