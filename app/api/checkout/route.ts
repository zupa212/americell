import Stripe from "stripe";
import { auth } from "@/auth";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { deviceById, type Cycle } from "@/lib/devices";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Please log in to continue." }, { status: 401 });
  }

  if (!isStripeConfigured || !stripe) {
    return Response.json(
      { error: "Payments are in demo mode — no Stripe key configured yet.", demo: true },
      { status: 503 },
    );
  }

  let body: { deviceId?: string; cycle?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const device = body.deviceId ? deviceById(body.deviceId) : undefined;
  if (!device) {
    return Response.json({ error: "Unknown device." }, { status: 400 });
  }
  const cycle: Cycle = body.cycle === "annual" ? "annual" : "monthly";

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const successUrl =
    process.env.CHECKOUT_SUCCESS_URL ?? `${origin}/dashboard?checkout=success`;
  const cancelUrl = process.env.CHECKOUT_CANCEL_URL ?? `${origin}/#pricing`;

  // Prefer a pre-created Stripe price id if provided, else build inline price_data
  // from the catalog so checkout works with zero pre-configuration.
  const envPriceId =
    process.env[`PRICE_${device.id.toUpperCase()}_${cycle.toUpperCase()}`];
  const amount = cycle === "annual" ? device.priceAnnual : device.priceMonthly;

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = envPriceId
    ? [{ price: envPriceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: `Americell — ${device.name} (${device.location})`,
            },
            unit_amount: Math.round(amount * 100),
            recurring: { interval: cycle === "annual" ? "year" : "month" },
          },
        },
      ];

  const metadata = { userId: session.user.id, deviceId: device.id, cycle };

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items,
    client_reference_id: session.user.id,
    customer_email: session.user.email ?? undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: { metadata },
  });

  return Response.json({ url: checkout.url });
}
