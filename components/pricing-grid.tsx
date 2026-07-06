"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Reveal from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShineBorder } from "@/components/ui/shine-border";
import { MagicCard } from "@/components/ui/magic-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Types ONLY — `@/lib/pricing` is server-only, so these imports are erased at
// build time and never pull the server module into the client bundle. DURATIONS
// (a runtime value) is passed down as a prop instead of imported here.
import type { BillingPeriod, PublicRetailPhone } from "@/lib/pricing";

// Shared frosted-glass recipe — floats over the global <SiteBackground/> aurora.
const GLASS =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";
const GLASS_HOVER =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";
// Animated brand gradient text — flashy, minimal; honors prefers-reduced-motion.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient";

/** One selectable rental duration — mirrors `DURATIONS` from `@/lib/pricing`. */
type DurationOption = {
  period: BillingPeriod;
  days: number;
  label: string;
};

type PricingGridProps = {
  /** Client-safe live catalog — retail cents only, NO wholesale. */
  phones: PublicRetailPhone[];
  /** The three rental durations with English labels (server passes `DURATIONS`). */
  durations: readonly DurationOption[];
};

type CheckoutResponse = { url?: string; error?: string; demo?: boolean };

/**
 * PricingGrid — client (RESELLER_PLAN §5.5 Flow A/B).
 *
 * A duration toggle over the three rental periods and one frosted MagicCard per
 * live phone. The card shows retail for the selected period; the CTA POSTs only
 * `{ phoneId, period }` to `/api/checkout` — the price is (re)computed server-
 * side, so the client can never dictate what it pays.
 */
export default function PricingGrid({ phones, durations }: PricingGridProps) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  // Which card is mid-request (drives the spinner on that card only).
  const [pendingId, setPendingId] = useState<string | null>(null);

  const activeLabel =
    durations.find((d) => d.period === period)?.label ?? "";

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

  if (phones.length === 0) {
    return (
      <Reveal delay={0.08} className="mx-auto mt-14 max-w-xl">
        <div className={cn(GLASS, "p-8 text-center sm:p-10")}>
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
            No devices available right now
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every phone is in use at the moment. Refresh in a little while —
            inventory changes constantly.
          </p>
        </div>
      </Reveal>
    );
  }

  return (
    <>
      {/* Duration toggle — drives the same `period` state across every card. */}
      <Reveal delay={0.08} className="mt-12 flex justify-center">
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as BillingPeriod)}
          aria-label="Rental duration"
        >
          <TabsList className="h-11 rounded-full border border-white/50 bg-white/60 p-1 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-md">
            {durations.map((d) => (
              <TabsTrigger
                key={d.period}
                value={d.period}
                className="min-w-[7rem] rounded-full px-5 font-semibold transition-all duration-300 data-active:bg-gradient-to-r data-active:from-brand data-active:to-brand-2 data-active:text-white data-active:shadow-glow"
              >
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Reveal>

      {/* Live phone grid */}
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {phones.map((phone, index) => {
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
              <MagicCard
                className="h-full rounded-3xl"
                gradientColor="rgba(43,107,255,0.12)"
                gradientFrom="var(--color-brand)"
                gradientTo="var(--color-brand-2)"
                gradientOpacity={0.55}
              >
                <div
                  className={cn(
                    "relative flex h-full flex-col p-7 sm:p-8",
                    GLASS,
                    phone.available ? GLASS_HOVER : "opacity-90",
                  )}
                >
                  {/* Shine accent reserved for buyable cards. */}
                  {phone.available && (
                    <ShineBorder
                      borderWidth={1.5}
                      duration={12}
                      shineColor={[
                        "var(--color-brand)",
                        "var(--color-brand-2)",
                        "var(--color-brand-soft)",
                      ]}
                    />
                  )}

                  {/* Header: brand "A" mark + model + platform badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-black leading-none text-white shadow-glow ring-1 ring-white/40"
                      >
                        A
                      </span>
                      <h3 className="truncate text-xl font-extrabold tracking-tight text-foreground">
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

                  {/* Availability + Americell verification trust mark */}
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
                        {phone.available ? "Available now" : "Unavailable"}
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

                  {/* Price for the selected duration */}
                  <div className="mt-7 flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        "text-4xl font-extrabold tracking-tight sm:text-5xl",
                        GRADIENT_TEXT,
                      )}
                    >
                      {price}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      / {activeLabel}
                    </span>
                  </div>

                  {/* What you get */}
                  <div className="mt-6 flex items-start gap-2.5 border-t border-white/50 pt-6">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-brand-2/15">
                      <Check
                        className="h-3.5 w-3.5 text-brand"
                        aria-hidden="true"
                      />
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Real US device · PIN and a live control link the moment
                      you pay.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-8">
                    <Button
                      type="button"
                      onClick={() => handleCheckout(phone)}
                      disabled={isPending || !phone.available}
                      aria-label={`Get ${phone.model}`}
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
                          Get this phone
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </>
                      ) : (
                        "Unavailable"
                      )}
                    </Button>
                  </div>
                </div>
              </MagicCard>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
