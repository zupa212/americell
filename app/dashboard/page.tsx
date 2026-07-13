import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, Smartphone } from "lucide-react";

import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import type { Rental } from "@/db/schema";
import { listRentalsForUser, markExpired } from "@/lib/rentals";
import { DURATIONS, getRetailCatalog } from "@/lib/pricing";
import { isMoonpayConfigured } from "@/lib/moonpay";
import { isNowpaymentsConfigured } from "@/lib/nowpayments";
import { isCoinbaseConfigured } from "@/lib/coinbase";
import { isBtcpayConfigured } from "@/lib/btcpay";
import RentalCard, { type RentalCardData } from "@/components/rental-card";
import DashboardUserMenu from "@/components/dashboard-user-menu";
import DashboardBuyPanel from "@/components/dashboard-buy-panel";
import CheckoutSuccess from "@/components/checkout-success";
import { type CryptoProvider } from "@/components/pricing-grid";
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// → "Americell · Dashboard" via the brand-first title template.
export const metadata = { title: "Dashboard" };

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// Statuses that entitle a live rental (§5.4: `pooled` is active-equivalent).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/**
 * Crypto payment options offered in the in-dashboard "Pay with crypto" picker.
 * `configured` is read from the SERVER-ONLY provider flags (env), so the client
 * only learns which options exist — never any keys. Identical to the landing
 * `pricing.tsx` helper so both checkout surfaces stay in lockstep.
 */
function cryptoProviders(): CryptoProvider[] {
  return [
    { id: "nowpayments", label: "Crypto (no sign-up)", note: "100+ coins · no KYC", noKyc: true, configured: isNowpaymentsConfigured },
    { id: "btcpay", label: "Bitcoin & Lightning", note: "Self-custody · no KYC", noKyc: true, configured: isBtcpayConfigured },
    { id: "coinbase", label: "Coinbase Commerce", note: "Pay from any wallet · no KYC", noKyc: true, configured: isCoinbaseConfigured },
    { id: "moonpay", label: "MoonPay", note: "Card or bank → crypto", noKyc: false, configured: isMoonpayConfigured },
  ];
}

/**
 * Project a full `Rental` row down to the client-safe shape RentalCard needs.
 *
 * CRITICAL (§7.4): `streamUrl` and `pinCiphertext` are NEVER included — those
 * secrets are served only from the ownership-checked `/access` and `/pin`
 * routes, never serialized into the dashboard HTML/RSC payload. Also strips
 * reseller margin data (`wholesaleQuotedCents` / `chargedCents`) and internal
 * payment ids. Timestamps become ISO strings for a clean server→client boundary.
 */
function toCardData(r: Rental): RentalCardData {
  return {
    id: r.id,
    phoneId: r.phoneId,
    model: r.model,
    platform: r.platform,
    billingPeriod: r.billingPeriod,
    durationDays: r.durationDays,
    retailCents: r.retailCents,
    status: r.status,
    streamMintedAt: r.streamMintedAt ? r.streamMintedAt.toISOString() : null,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let rows: Rental[] = [];
  let dbError = false;
  if (isDbConfigured) {
    try {
      rows = await listRentalsForUser(session.user.id);

      // Lazy expiry (§5.5 D): flip any live rental whose expiry has passed. The
      // decision lives in SQL — `markExpired` is a guarded CAS
      // (WHERE status='active' AND expiresAt < now()), so firing it on every
      // active rental only flips the truly-expired ones (the rest match 0 rows).
      // We then re-read to reflect any flips, keeping this Server Component pure
      // (no wall-clock read during render).
      const live = rows.filter(
        (r) => r.status === "active" && r.expiresAt != null,
      );
      if (live.length > 0) {
        await Promise.all(live.map((r) => markExpired(r.id)));
        rows = await listRentalsForUser(session.user.id);
      }
    } catch {
      dbError = true;
    }
  }

  // Partition into Active (entitled) vs History (everything else).
  const active: RentalCardData[] = [];
  const history: RentalCardData[] = [];
  for (const r of rows) {
    (ACTIVE_STATUSES.has(r.status) ? active : history).push(toCardData(r));
  }

  const email = session.user.email ?? "";
  const hasAny = active.length > 0 || history.length > 0;

  // Live retail catalog for the in-dashboard rent panel. Fails closed on the
  // server (never fetched on the client) so the page stays a pure Server
  // Component with the panel as its single client island.
  const catalog = await getRetailCatalog();

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg outline-none transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-bold text-white shadow-sm shadow-brand/20"
            >
              A
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              <AuroraText>Americell</AuroraText>
            </span>
          </Link>
          <DashboardUserMenu email={email} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* Post-payment confirmation — reads ?checkout=success / ?crypto=success,
            auto-refreshes until the webhook-activated rental appears. Renders
            nothing on a normal visit. Suspense wraps the useSearchParams read. */}
        <Suspense fallback={null}>
          <CheckoutSuccess activeCount={active.length} />
        </Suspense>

        <Reveal>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Your rentals
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage the real US phones you&rsquo;ve rented — PIN, remote control,
            and time remaining.
          </p>
        </Reveal>

        {/* Rent-a-phone shelf — greets zero-rental & db-unconfigured users first,
            renders independently of the rentals DB, rides the existing gap-8. */}
        {catalog.ok ? (
          <DashboardBuyPanel
            phones={catalog.phones}
            durations={DURATIONS}
            cryptoProviders={cryptoProviders()}
          />
        ) : (
          <Reveal delay={0.05}>
            <div className={cn(glassCard, "p-6")}>
              {catalog.reason === "unconfigured" ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">
                    Demo mode
                  </p>
                  <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                    Live inventory isn&rsquo;t wired up yet
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    The device provider isn&rsquo;t configured in this
                    environment, so we can&rsquo;t show live pricing right now.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">
                    Temporary hiccup
                  </p>
                  <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                    Inventory didn&rsquo;t load
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    We couldn&rsquo;t load available devices just now. Refresh in
                    a moment to see live pricing.
                  </p>
                </>
              )}
            </div>
          </Reveal>
        )}

        {!isDbConfigured || dbError ? (
          <Reveal delay={0.05}>
            <Alert className={cn("border-white/50 bg-white/60 backdrop-blur-md")}>
              <Database className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>The database isn&rsquo;t connected yet.</AlertTitle>
              <AlertDescription>
                Add <code>DATABASE_URL</code> (see{" "}
                <code>.env.example</code>) and run the migrations to see your
                rentals here.
              </AlertDescription>
            </Alert>
          </Reveal>
        ) : !hasAny ? (
          <Reveal delay={0.05}>
            <div className={cn("relative overflow-hidden text-center", glassCard)}>
              <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 px-6 py-12 sm:py-14">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/70 text-brand backdrop-blur-md"
                >
                  <Smartphone className="h-6 w-6" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    No rentals yet
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your rented phones show up here. Pick one from{" "}
                    <span className="font-medium text-foreground">
                      Rent a phone
                    </span>{" "}
                    above to get started.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="flex flex-col gap-8">
            {active.length > 0 ? (
              <section>
                <Reveal>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Active
                  </h2>
                </Reveal>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {active.map((rental, i) => (
                    <Reveal as="li" key={rental.id} delay={Math.min(i, 3) * 0.05}>
                      <RentalCard rental={rental} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ) : null}

            {history.length > 0 ? (
              <section>
                <Reveal>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    History
                  </h2>
                </Reveal>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {history.map((rental, i) => (
                    <Reveal as="li" key={rental.id} delay={Math.min(i, 3) * 0.05}>
                      <RentalCard rental={rental} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
