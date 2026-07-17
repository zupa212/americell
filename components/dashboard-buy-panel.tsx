"use client";

import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import Reveal from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Types ONLY — `@/lib/pricing` is server-only, so these imports are erased at
// build time and never pull the server module into the client bundle. DURATIONS
// (a runtime value) is passed down as a prop instead of imported here.
import type { BillingPeriod, PublicRetailPhone } from "@/lib/pricing";
import { CRYPTO_ENABLED } from "@/lib/features";
// The crypto-provider shape is a shared TYPE (erased at build); reused verbatim
// from the reference grid so the two flows never drift.
import type { CryptoProvider } from "@/components/pricing-grid";

// ---------------------------------------------------------------------------
// Shared card system (single source of truth — mirrors the rental card verbatim
// so both customer surfaces read as one system). Values are kept byte-identical
// to the rental card's tokens; consolidating to a re-export is a no-op refactor.
// ---------------------------------------------------------------------------

/** Frosted-glass surface — applied ONLY on `<Card>`; sets the 20px slot rhythm. */
const GLASS_SURFACE =
  "relative h-full rounded-3xl border border-white/50 bg-white/65 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] [--card-spacing:--spacing(5)]";

/** Hover affordance (reduced-motion-safe) layered on top of the surface. */
const GLASS_LIFT =
  "transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none";

/**
 * The ONLY status palette — dark-paired for AA over the frost.
 *   green = available/live · amber = in-flight · rose = unavailable · muted = off
 */
const STATUS_STYLES = {
  green: {
    chip: "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    rail: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  amber: {
    chip: "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300",
    rail: "bg-amber-500",
    dot: "bg-amber-500",
  },
  rose: {
    chip: "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300",
    rail: "bg-rose-500",
    dot: "bg-rose-500",
  },
  muted: {
    chip: "border-border bg-muted text-muted-foreground",
    rail: "bg-muted-foreground/30",
    dot: "bg-muted-foreground/40",
  },
} as const;

/** The ONE gradient — spent once per card on a stock `<Button>`. */
const CTA_GRADIENT =
  "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-glow border-white/30 ring-1 ring-white/20 hover:opacity-95";

/** Per-platform pill tint (iPhone = brand blue, Android = brand violet). */
function platformPillClass(platform: string): string {
  return platform === "iphone"
    ? "border-transparent bg-brand/10 text-brand"
    : "border-transparent bg-brand-2/10 text-brand-2";
}

/** Per-platform glyph tint, matching the pill. */
function platformGlyphClass(platform: string): string {
  return platform === "iphone" ? "text-brand" : "text-brand-2";
}

/** One selectable rental duration — mirrors `DURATIONS` from `@/lib/pricing`. */
type DurationOption = {
  period: BillingPeriod;
  days: number;
  label: string;
};

type DashboardBuyPanelProps = {
  /** Client-safe live catalog — retail cents only, NO wholesale. */
  phones: PublicRetailPhone[];
  /** The three rental durations with English labels (server passes `DURATIONS`). */
  durations: readonly DurationOption[];
  /** Crypto options for the picker (server passes which are configured). */
  cryptoProviders?: CryptoProvider[];
};

type CheckoutResponse = { url?: string; error?: string; demo?: boolean };

/**
 * DashboardBuyPanel — client island for the customer dashboard.
 *
 * A single "Available now" glass shelf: one duration control reprices every card
 * in place, and each card's CTA POSTs only `{ phoneId, period }` (crypto adds
 * `provider`) to the same server-priced checkout the landing grid uses. The price
 * is (re)computed server-side, so the client can NEVER dictate what it pays.
 * Tidiness rule: the brand gradient is spent in exactly two places — the active
 * duration thumb and each card's primary CTA. Everything else is white/frost.
 */
export default function DashboardBuyPanel({
  phones,
  durations,
  cryptoProviders = [],
}: DashboardBuyPanelProps) {
  // Only offer durations at least one live device is actually priced for at
  // CellGods; a device shows "—" for any term it doesn't support.
  const periodSupported = (p: PublicRetailPhone, per: BillingPeriod) =>
    p.availablePeriods.includes(per);
  const availableDurations = durations.filter((d) =>
    phones.some((p) => periodSupported(p, d.period)),
  );
  const [period, setPeriod] = useState<BillingPeriod>(() =>
    availableDurations.some((d) => d.period === "monthly")
      ? "monthly"
      : (availableDurations[0]?.period ?? "monthly"),
  );
  // Which card is mid-request (drives the spinner on that card only).
  const [pendingId, setPendingId] = useState<string | null>(null);
  // The phone whose crypto-provider picker is open (null = closed).
  const [cryptoPhone, setCryptoPhone] = useState<PublicRetailPhone | null>(null);
  // Which crypto provider is mid-request (drives the row spinner).
  const [cryptoBusy, setCryptoBusy] = useState<CryptoProvider["id"] | null>(null);

  const activeLabel = durations.find((d) => d.period === period)?.label ?? "";

  const handleCheckout = async (phone: PublicRetailPhone) => {
    setPendingId(phone.phoneId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phoneId: phone.phoneId, period }),
      });

      if (res.status === 401) {
        // Not logged in — send them to sign in.
        window.location.href = "/login";
        return;
      }

      const data: CheckoutResponse = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      toast(
        data.demo
          ? "Payments are in demo mode — not configured yet."
          : (data.error ?? "Couldn't start checkout. Please try again."),
      );
    } catch {
      toast("Network error. Please try again.");
    } finally {
      setPendingId(null);
    }
  };

  // Pay with crypto via the chosen provider — same server-priced flow, returns a
  // hosted payment URL. Provider choice is sent to the unified crypto endpoint.
  const startCrypto = async (
    phone: PublicRetailPhone,
    provider: CryptoProvider["id"],
  ) => {
    setCryptoBusy(provider);
    try {
      const res = await fetch("/api/crypto/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phoneId: phone.phoneId, period, provider }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data: CheckoutResponse = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      toast(
        data.demo
          ? "Crypto payments are in demo mode — not configured yet."
          : (data.error ?? "Couldn't start crypto checkout. Please try again."),
      );
    } catch {
      toast("Network error. Please try again.");
    } finally {
      setCryptoBusy(null);
    }
  };

  // Available-first ordering (stable enough for a small live catalog).
  const sorted = [...phones].sort(
    (a, b) => Number(b.available) - Number(a.available),
  );
  const availableCount = phones.filter((p) => p.available).length;

  return (
    <section aria-labelledby="rent-heading">
      {/* Header: brand cue + heading + one muted line, with the duration control. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-white shadow-glow ring-1 ring-white/40"
            >
              <Smartphone className="h-4 w-4" />
            </span>
            <h2
              id="rent-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Rent a phone
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Available now from live US inventory · {availableCount}{" "}
            {availableCount === 1 ? "device" : "devices"}
          </p>
        </div>

        {/* Duration control — set the term once, the whole shelf reprices. */}
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as BillingPeriod)}
          aria-label="Rental duration"
          className="w-full sm:w-auto"
        >
          <TabsList className="h-11 w-full rounded-full border border-white/50 bg-white/60 p-1 ring-1 ring-white/40 backdrop-blur-md sm:h-10 sm:w-auto">
            {availableDurations.map((d) => (
              <TabsTrigger
                key={d.period}
                value={d.period}
                className="min-w-0 flex-1 rounded-full px-4 font-semibold transition-all duration-300 data-active:bg-gradient-to-r data-active:from-brand data-active:to-brand-2 data-active:text-white data-active:shadow-glow sm:min-w-[6rem] sm:flex-none"
              >
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="sr-only" aria-live="polite">
            Prices updated to {activeLabel}
          </span>
        </Tabs>
      </div>

      {phones.length === 0 ? (
        // catalog.ok but empty — keep the header, show one calm centered panel.
        <div className="mt-5 rounded-3xl border border-white/50 bg-white/60 p-8 text-center backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]">
          <p className="text-sm text-muted-foreground">
            No devices available right now — inventory changes constantly.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((phone, index) => {
            const isPending = pendingId === phone.phoneId;
            const supported = periodSupported(phone, period);
            const price = supported
              ? fmtMoney(phone.retail[period], phone.currency)
              : null;
            const buyable = phone.available && supported;
            const platformLabel =
              phone.platform === "iphone" ? "iPhone" : "Android";
            // Rail = green when buyable, muted otherwise; availability chip
            // carries the meaning in TEXT (green live / rose in-use), never hue.
            const railTone = phone.available ? "green" : "muted";
            const availTone = phone.available ? "green" : "rose";

            return (
              <Reveal
                as="article"
                key={phone.phoneId}
                delay={0.05 * Math.min(index, 6)}
                className="h-full"
              >
                <Card
                  className={cn(
                    GLASS_SURFACE,
                    phone.available ? GLASS_LIFT : "opacity-70",
                    isPending && "pointer-events-none",
                  )}
                >
                  {/* Full-height status rail — clipped to the rounded corners. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-3xl",
                      STATUS_STYLES[railTone].rail,
                    )}
                  />

                  <CardHeader>
                    <CardTitle className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-white/50 bg-white/50 backdrop-blur-md"
                      >
                        <Smartphone
                          className={cn(
                            "h-4 w-4",
                            platformGlyphClass(phone.platform),
                          )}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="truncate" title={phone.model}>
                        {phone.model}
                      </span>
                    </CardTitle>
                    <CardAction>
                      <Badge
                        variant="outline"
                        className={platformPillClass(phone.platform)}
                      >
                        {platformLabel}
                      </Badge>
                    </CardAction>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={STATUS_STYLES[availTone].chip}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            STATUS_STYLES[availTone].dot,
                          )}
                        />
                        {phone.available ? "Available now" : "In use"}
                      </Badge>
                      <Badge
                        title="Real US device, verified by Americell"
                        className="border-brand/20 bg-brand/10 text-brand"
                      >
                        <BadgeCheck aria-hidden="true" />
                        Real US device
                      </Badge>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-3">
                    <Separator className="bg-white/50" />
                    {/* Price for the selected duration (amount + suffix grouped). */}
                    {supported ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                          {price}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          / {activeLabel}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not offered on a {activeLabel.toLowerCase()} term — pick
                        another duration above.
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col items-stretch gap-2 border-t border-white/40 bg-transparent">
                    <Button
                      type="button"
                      onClick={() => handleCheckout(phone)}
                      disabled={isPending || !buyable}
                      aria-label={`Rent ${phone.model}`}
                      className={cn(
                        "group/cta min-h-11 w-full rounded-full font-semibold",
                        buyable
                          ? CTA_GRADIENT
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isPending ? (
                        <>
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Starting…
                        </>
                      ) : !phone.available ? (
                        "In use"
                      ) : !supported ? (
                        "Unavailable for this term"
                      ) : (
                        <>
                          Rent this phone
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transform-none"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </Button>

                    {/* Payment methods hint + quiet crypto secondary (buyable only). */}
                    {buyable && (
                      <>
                        <p className="w-full text-center text-[0.7rem] text-muted-foreground">
                          Card · Apple&nbsp;Pay · Google&nbsp;Pay &amp; more
                        </p>
                        {CRYPTO_ENABLED && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCryptoPhone(phone)}
                            aria-label={`Pay for ${phone.model} with crypto`}
                            className="min-h-11 w-full gap-1.5 rounded-full font-semibold"
                          >
                            <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                            Pay with crypto
                          </Button>
                        )}
                      </>
                    )}
                  </CardFooter>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Crypto provider picker — shared Dialog, guarded so it can't close mid-request. */}
      <Dialog
        open={cryptoPhone !== null}
        onOpenChange={(open) => {
          if (!open && !cryptoBusy) setCryptoPhone(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-white/50 bg-white/80 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Pay with crypto
            </DialogTitle>
            <DialogDescription>
              {cryptoPhone ? (
                <>
                  {cryptoPhone.model} ·{" "}
                  <span className="font-semibold text-foreground">
                    {fmtMoney(cryptoPhone.retail[period], cryptoPhone.currency)}
                  </span>{" "}
                  / {activeLabel}. Pick how you&apos;d like to pay — your device
                  activates the moment payment confirms.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-3">
            {cryptoProviders.map((provider) => {
              const busy = cryptoBusy === provider.id;
              const disabled = cryptoBusy !== null;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() =>
                    cryptoPhone && startCrypto(cryptoPhone, provider.id)
                  }
                  disabled={disabled}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-[0_16px_40px_-20px_rgba(43,107,255,0.45)] disabled:pointer-events-none disabled:opacity-60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand"
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : provider.noKyc ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <Coins className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">
                        {provider.label}
                      </span>
                      {provider.noKyc && (
                        <Badge className="border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[0.65rem] font-semibold text-emerald-600">
                          No KYC
                        </Badge>
                      )}
                      {!provider.configured && (
                        <Badge
                          variant="secondary"
                          className="border-transparent bg-muted px-1.5 py-0 text-[0.65rem] font-medium text-muted-foreground"
                        >
                          Demo
                        </Badge>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {provider.note}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <p className="mx-auto mt-1 max-w-[46ch] text-center text-[0.7rem] leading-relaxed text-pretty text-muted-foreground">
            Prices are set in USD and settle in crypto. Payment is processed by
            the provider you choose.
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
