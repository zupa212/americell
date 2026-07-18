import "server-only";

import Link from "next/link";
import Reveal from "@/components/ui/reveal";
import PricingGrid, { type CryptoProvider } from "@/components/pricing-grid";
import { AuroraText } from "@/components/ui/aurora-text";
import { DURATIONS, getRetailCatalog } from "@/lib/pricing";
import { isMoonpayConfigured } from "@/lib/moonpay";
import { isNowpaymentsConfigured } from "@/lib/nowpayments";
import { isCoinbaseConfigured } from "@/lib/coinbase";
import { isBtcpayConfigured } from "@/lib/btcpay";
import { cn } from "@/lib/utils";

/**
 * Crypto payment options offered in the "Pay with crypto" picker. `configured`
 * is read from the SERVER-ONLY provider flags (env), so the client only learns
 * which options exist — never any keys. `noKyc` surfaces the no-sign-up options
 * the customer can pay with anonymously.
 */
function cryptoProviders(): CryptoProvider[] {
  const all: CryptoProvider[] = [
    { id: "nowpayments", label: "NOWPayments", note: "100+ coins · no sign-up · no KYC", noKyc: true, configured: isNowpaymentsConfigured },
    { id: "btcpay", label: "Bitcoin & Lightning", note: "Self-custody · no KYC", noKyc: true, configured: isBtcpayConfigured },
    { id: "coinbase", label: "Coinbase Commerce", note: "Pay from any wallet · no KYC", noKyc: true, configured: isCoinbaseConfigured },
    { id: "moonpay", label: "MoonPay", note: "Card or bank → crypto", noKyc: false, configured: isMoonpayConfigured },
  ];
  return all.filter((p) => p.configured); // only show payment methods that are actually live
}

/**
 * Pricing — SERVER component (RESELLER_PLAN §5.5 Flow A, §5.1).
 *
 * Renders the landing pricing section over LIVE CellGods inventory. It calls the
 * server-only `getRetailCatalog()`, which strips all wholesale cost and returns
 * only `PublicRetailPhone[]` (retail cents per period). On failure it fails
 * closed with an English demo / retry notice; on success it hands the client-safe
 * catalog to the client `<PricingGrid/>` (duration toggle + checkout).
 *
 * NEVER imports wholesale or the margin %; only retail cents cross to the client.
 */

// Shared frosted-glass recipe — floats over the global <SiteBackground/> aurora.
const GLASS =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// Brand-blue tuned aurora stops for the "Americell" wordmark (#2b6bff → #7c3aed → #5aa2ff).
const BRAND_AURORA = ["#2b6bff", "#7c3aed", "#5aa2ff"] as const;

/**
 * BrandBackdrop — purely decorative, aria-hidden.
 *
 * A soft brand-gradient glow plus a very faint, repeating "AMERICELL" wordmark
 * watermark that sits BEHIND the live grid so the brand is felt without ever
 * competing with the pricing content. Transform/opacity only; no JS, no motion.
 */
function BrandBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Brand-gradient glow */}
      <div
        className="absolute left-1/2 top-1/3 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(43,107,255,0.16), rgba(124,58,237,0.10) 45%, transparent 70%)",
        }}
      />
      {/* Faint repeating AMERICELL watermark — felt, never spammy (~3.5% ink). */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-8">
        {[0, 1, 2].map((row) => (
          <span
            key={row}
            className="whitespace-nowrap text-[13vw] font-black uppercase leading-none tracking-tighter sm:text-[10vw]"
            style={{ color: "rgba(43,107,255,0.035)" }}
          >
            AMERICELL · AMERICELL
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function Pricing() {
  const catalog = await getRetailCatalog();

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative isolate py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          {/* Branded eyebrow — gradient "A" mark + AuroraText wordmark + label. */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-2 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-md">
              <span
                aria-hidden="true"
                className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-[0.7rem] font-black leading-none text-white shadow-sm ring-1 ring-white/40"
              >
                A
              </span>
              <AuroraText colors={[...BRAND_AURORA]}>Americell</AuroraText>
              <span
                aria-hidden="true"
                className="h-3 w-px bg-brand-2/30"
              />
              Fleet Pricing
            </span>
          </div>
          <h2
            id="pricing-heading"
            className="mt-5 text-balance break-words text-4xl font-black leading-[0.98] tracking-tighter text-foreground sm:text-6xl sm:leading-[0.95] lg:text-7xl"
          >
            Build your fleet.{" "}
            <span className="animate-gradient bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent">
              Priced per device.
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Deploy real iPhones and Android devices from{" "}
            <span className="font-semibold text-brand-2">Americell</span>&apos;s
            live inventory and run the whole fleet from one dashboard. Transparent
            per-device pricing — hosting, maintenance and hardware replacement
            included. No setup fees. Cancel anytime. Live in minutes.
          </p>
        </Reveal>

        {catalog.ok ? (
          <div className="relative isolate mt-4">
            <BrandBackdrop />
            <PricingGrid
              phones={catalog.phones}
              durations={DURATIONS}
              cryptoProviders={cryptoProviders()}
            />
          </div>
        ) : (
          <Reveal delay={0.08} className="mx-auto mt-14 max-w-xl">
            <div className={cn(GLASS, "p-8 text-center sm:p-10")}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">
                {catalog.reason === "error" ? "Temporary hiccup" : "Selling fast"}
              </p>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                {catalog.reason === "error"
                  ? "Inventory didn't load"
                  : "US devices sell out fast"}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Real US iPhones from{" "}
                <span className="font-semibold text-foreground">€250/mo</span> and
                Android from{" "}
                <span className="font-semibold text-foreground">€150/mo</span> — US
                SIM &amp; data included.{" "}
                {catalog.reason === "error"
                  ? "Refresh in a moment for live stock, or get notified below."
                  : "Get notified the moment they're back in stock."}
              </p>
              <Link
                href="/waitlist"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-7 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5"
              >
                Join the waitlist
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
