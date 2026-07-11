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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
// The crypto-provider shape is a shared TYPE (erased at build); reused verbatim
// from the reference grid so the two flows never drift.
import type { CryptoProvider } from "@/components/pricing-grid";

// Calmer frosted-glass recipe than the landing grid — same surface, gentler lift.
const GLASS =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";
const GLASS_HOVER =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

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
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
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
          <TabsList className="h-10 w-full rounded-full border border-white/50 bg-white/60 p-1 ring-1 ring-white/40 backdrop-blur-md sm:w-auto">
            {durations.map((d) => (
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
        <div className={cn(GLASS, "mt-5 p-8 text-center")}>
          <p className="text-sm text-muted-foreground">
            No devices available right now — inventory changes constantly.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((phone, index) => {
            const isPending = pendingId === phone.phoneId;
            const price = fmtMoney(phone.retail[period], phone.currency);
            const platformLabel =
              phone.platform === "iphone" ? "iPhone" : "Android";

            return (
              <Reveal
                as="article"
                key={phone.phoneId}
                delay={0.05 * Math.min(index, 6)}
              >
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-3xl p-5 sm:p-6",
                    GLASS,
                    phone.available ? GLASS_HOVER : "opacity-70",
                    isPending && "pointer-events-none",
                  )}
                >
                  {/* Header: glass glyph tile (platform-tinted) + model + platform pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/50 bg-white/50 backdrop-blur-md"
                      >
                        <Smartphone
                          className={cn(
                            "h-5 w-5",
                            phone.platform === "iphone"
                              ? "text-brand"
                              : "text-brand-2",
                          )}
                        />
                      </span>
                      <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
                        {phone.model}
                      </h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-transparent bg-brand-2/10 text-brand-2"
                    >
                      {platformLabel}
                    </Badge>
                  </div>

                  {/* Status line — carried by TEXT, never color alone — + trust mark */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-flex h-2 w-2 rounded-full",
                          phone.available
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/40",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          phone.available
                            ? "text-emerald-600"
                            : "text-muted-foreground",
                        )}
                      >
                        {phone.available ? "Available now" : "In use"}
                      </span>
                    </span>
                    <Badge
                      title="Real US device, verified by Americell"
                      className="border-brand/20 bg-brand/10 text-brand"
                    >
                      <BadgeCheck aria-hidden="true" />
                      Real US device
                    </Badge>
                  </div>

                  {/* Hairline divider + price for the selected duration */}
                  <div className="mt-5 border-t border-white/50 pt-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                        {price}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        / {activeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Action stack pinned to the bottom for equal-height rows. */}
                  <div className="mt-auto pt-6">
                    <Button
                      type="button"
                      onClick={() => handleCheckout(phone)}
                      disabled={isPending || !phone.available}
                      aria-label={`Rent ${phone.model}`}
                      className={cn(
                        "group/cta h-12 w-full rounded-full px-6 text-sm font-semibold transition-all duration-300",
                        phone.available
                          ? "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-glow hover:opacity-95"
                          : "bg-foreground/70 text-background",
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
                      ) : phone.available ? (
                        <>
                          Rent this phone
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </>
                      ) : (
                        "In use"
                      )}
                    </Button>

                    {/* Payment methods hint + quiet crypto secondary (buyable only). */}
                    {phone.available && (
                      <>
                        <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
                          Card · Apple&nbsp;Pay · Google&nbsp;Pay &amp; more
                        </p>
                        <button
                          type="button"
                          onClick={() => setCryptoPhone(phone)}
                          aria-label={`Pay for ${phone.model} with crypto`}
                          className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-white/50 bg-white/40 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-md transition-all duration-300 hover:bg-white/70 hover:text-foreground"
                        >
                          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                          Pay with crypto
                        </button>
                      </>
                    )}
                  </div>
                </div>
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
        <DialogContent className="max-w-md rounded-3xl border-white/50 bg-white/80 backdrop-blur-xl">
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

          <p className="mt-1 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            Prices are set in USD and settle in crypto. Payment is processed by
            the provider you choose.
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
