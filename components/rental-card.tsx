"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import RemoteControlButton from "@/components/remote-control-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Client-safe view of a rental — exactly the fields the dashboard card needs.
 *
 * CRITICAL (§7.4): this NEVER carries `streamUrl` or `pinCiphertext`. Those
 * secrets are fetched on demand from the ownership-checked `/access` and `/pin`
 * routes, never serialized into the page HTML/RSC payload. Timestamps are ISO
 * strings so the server/client boundary is unambiguous.
 */
export type RentalCardData = {
  id: string;
  phoneId: string;
  model: string;
  platform: string; // "android" | "iphone"
  billingPeriod: string; // "daily" | "weekly" | "monthly"
  durationDays: number;
  retailCents: number;
  status: string;
  streamMintedAt: string | null; // ISO — for the 4h token-freshness hint
  expiresAt: string | null; // ISO — rental expiry (drives the countdown)
  createdAt: string; // ISO
};

/* ────────────────────────────────────────────────────────────────────────────
 * This card's design tokens — the frosted surface, hover lift, the one semantic
 * status palette, the single CTA gradient, and the per-platform tint. The device
 * card in dashboard-buy-panel.tsx mirrors this exact palette (same spec) so the
 * two customer cards read as one system.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * (a) The frosted-glass surface — applied ONLY to `<Card>`, verbatim on both
 * cards. `relative` anchors the status rail; the Card primitive already ships
 * `overflow-hidden` (which clips the rail to the rounded-3xl corners) so we do
 * NOT re-declare overflow. `rounded-3xl`/`bg-white/65`/`ring-white/40` override
 * the primitive's defaults via tailwind-merge. `[--card-spacing:--spacing(5)]`
 * is the one roomifier token: 20px padding on every slot + 20px inter-slot gap.
 */
const GLASS_SURFACE =
  "relative h-full rounded-3xl border border-white/50 bg-white/65 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] [--card-spacing:--spacing(5)]";

/** (b) The hover affordance — the shared interaction accent, reduced-motion-safe. */
const GLASS_LIFT =
  "transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none";

/**
 * (c) The ONLY status palette, dark-paired for WCAG AA over the white/65 frost.
 * Three keys per tone: `chip` (Badge outline classes), `rail` (the full-height
 * left status rail), `dot` (the availability dot on the device card).
 *   green = active/available/paid-live · amber = in-flight/on-hold
 *   rose  = refunded/failed/unavailable · muted = expired/finished
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

/** (d) The ONE gradient — spent once per card on a stock Button. text-white clears AA. */
const CTA_GRADIENT =
  "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-glow border-white/30 ring-1 ring-white/20 hover:opacity-95";

/**
 * Per-platform tint helper (correct blue for iPhone, violet for Android). Shared
 * with the device card so the platform pill + glyph read identically on both.
 */
function platformStyles(platform: string): {
  label: string;
  pill: string;
  icon: string;
} {
  const isIphone = platform === "iphone";
  return {
    label: isIphone ? "iPhone" : "Android",
    pill: isIphone
      ? "border-transparent bg-brand/10 text-brand"
      : "border-transparent bg-brand-2/10 text-brand-2",
    icon: isIphone ? "text-brand" : "text-brand-2",
  };
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/** CellGods statuses that entitle a live rental (§5.4: `pooled` ≈ active). */
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/** Label for a billing period. */
function periodLabel(period: string): string {
  switch (period) {
    case "daily":
      return "Day";
    case "weekly":
      return "Week";
    case "monthly":
      return "Month";
    default:
      return period;
  }
}

/**
 * Status → { tone, label }, driven only by `rental.status`. The tone selects the
 * shared STATUS_STYLES palette (chip/rail/dot); the label strings are unchanged.
 * green for a live rental, amber while it's still in-flight, rose for a refund,
 * muted once it's finished.
 */
function statusBadge(status: string): {
  tone: keyof typeof STATUS_STYLES;
  label: string;
} {
  switch (status) {
    case "active":
    case "pooled":
      return { tone: "green", label: "active" };
    case "pending_payment":
      return { tone: "amber", label: "payment pending" };
    case "paid":
      return { tone: "amber", label: "processing" };
    case "activating":
      return { tone: "amber", label: "activating…" };
    case "activation_pending_credit":
      return { tone: "amber", label: "on hold" };
    case "refunded":
      return { tone: "rose", label: "refunded" };
    case "expired":
      return { tone: "muted", label: "expired" };
    case "deactivated":
      return { tone: "muted", label: "canceled" };
    default:
      return { tone: "muted", label: status };
  }
}

/** Human countdown for a positive duration in ms. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days >= 1) return `${days}d ${hours}h ${minutes}m`;
  if (hours >= 1) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function RentalCard({ rental }: { rental: RentalCardData }) {
  const router = useRouter();

  const isActive = ACTIVE_STATUSES.has(rental.status);
  const platform = platformStyles(rental.platform);

  // Live clock — stays `null` on the server and first client paint (so the
  // time-dependent text can't cause a hydration mismatch), then starts ticking
  // once mounted. Only runs while the rental is live; the initial read is
  // deferred via setTimeout so we never call setState synchronously in an effect.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    if (!isActive) return;
    const tick = () => setNowMs(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [isActive]);

  // PIN reveal / copy state.
  const [pin, setPin] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Renew / cancel state.
  const [renewLoading, setRenewLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const expiresMs = rental.expiresAt ? Date.parse(rental.expiresAt) : null;
  const streamMintedMs = rental.streamMintedAt
    ? Date.parse(rental.streamMintedAt)
    : null;

  const countdown =
    nowMs == null || expiresMs == null
      ? "—"
      : formatRemaining(expiresMs - nowMs);

  // Token freshness: the 4h stream token is "fresh" only if it was minted less
  // than 4h ago; otherwise the CellGods stream page must re-mint it from the PIN.
  const tokenFresh =
    nowMs != null &&
    streamMintedMs != null &&
    nowMs - streamMintedMs < FOUR_HOURS_MS;

  const badge = statusBadge(rental.status);

  async function revealPin() {
    if (pin) return; // already fetched
    setPinLoading(true);
    try {
      const res = await fetch(`/api/rentals/${rental.id}/pin`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        pin?: string;
        error?: string;
      };
      if (res.ok && data.pin) {
        setPin(data.pin);
      } else if (res.status === 403) {
        toast.error("You don't have access to this device.");
      } else if (res.status === 410) {
        toast.error("This rental has expired.");
      } else {
        toast.error(data.error ?? "Couldn't retrieve the PIN.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPinLoading(false);
    }
  }

  async function copyPin() {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      toast.success("PIN copied.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy.");
    }
  }

  async function renew() {
    setRenewLoading(true);
    try {
      // Re-purchase the SAME phone + period → a fresh Stripe Checkout Session.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneId: rental.phoneId,
          period: rental.billingPeriod,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 401) {
        toast.error("Your session expired — sign in again.");
      } else if (res.status === 409) {
        toast.error("This device was just taken by someone else.");
      } else {
        toast.error(data.error ?? "Couldn't renew.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRenewLoading(false);
    }
  }

  async function cancel() {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/rentals/${rental.id}/cancel`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        toast.success("Rental canceled.");
        setCancelOpen(false);
        router.refresh();
        return;
      }
      if (res.status === 403) {
        toast.error("You don't have access to this device.");
      } else {
        toast.error(data.error ?? "Couldn't cancel.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <Card className={cn(GLASS_SURFACE, GLASS_LIFT)}>
      {/* Full-height status rail — static; tone tracks the rental status. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-3xl",
          STATUS_STYLES[badge.tone].rail,
        )}
      />

      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-2">
          <Smartphone
            className="h-4 w-4 shrink-0 text-brand"
            aria-hidden="true"
          />
          <span className="min-w-0 truncate" title={rental.model}>
            {rental.model}
          </span>
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={STATUS_STYLES[badge.tone].chip}>
            {badge.label}
          </Badge>
        </CardAction>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={platform.pill}>
            {platform.label}
          </Badge>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {periodLabel(rental.billingPeriod)} · {fmtMoney(rental.retailCents)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {isActive ? (
          <>
            {/* Live expiry countdown */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-sm backdrop-blur-md">
              <Clock
                className="h-4 w-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">Expires in</span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">
                {countdown}
              </span>
            </div>

            {/* 4h token-freshness hint (rendered once the clock is known) */}
            {nowMs != null ? (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs backdrop-blur-md",
                  tokenFresh
                    ? STATUS_STYLES.green.chip
                    : STATUS_STYLES.amber.chip,
                )}
              >
                {tokenFresh ? (
                  <ShieldCheck
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <TriangleAlert
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {tokenFresh ? (
                  <span>Live link — open directly.</span>
                ) : (
                  <span>Enter the PIN to open the device.</span>
                )}
              </div>
            ) : null}

            {/* PIN reveal / copy */}
            {pin ? (
              <button
                type="button"
                onClick={copyPin}
                className="group flex items-center gap-2 rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-left text-sm backdrop-blur-md transition-colors hover:bg-white/70"
              >
                <KeyRound
                  className="h-4 w-4 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <span className="font-mono text-base font-semibold tracking-[0.3em] tabular-nums text-foreground">
                  {pin}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </span>
              </button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={revealPin}
                disabled={pinLoading}
                className="h-11 w-full justify-start gap-2 rounded-2xl border-white/50 bg-white/50 backdrop-blur-md sm:h-10"
              >
                {pinLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                )}
                {pinLoading ? "Loading…" : "Reveal PIN"}
              </Button>
            )}
          </>
        ) : rental.status === "refunded" ? (
          <p
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm backdrop-blur-md",
              STATUS_STYLES.rose.chip,
            )}
          >
            Refunded — try again.
          </p>
        ) : rental.status === "activation_pending_credit" ? (
          <p
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm backdrop-blur-md",
              STATUS_STYLES.amber.chip,
            )}
          >
            Activation is delayed — it&rsquo;ll finish soon.
          </p>
        ) : (
          <p
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm backdrop-blur-md",
              STATUS_STYLES.muted.chip,
            )}
          >
            {periodLabel(rental.billingPeriod)} · {fmtMoney(rental.retailCents)}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-2 border-t border-white/40 bg-transparent">
        {isActive ? (
          <>
            <RemoteControlButton rentalId={rental.id} />
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={renew}
                disabled={renewLoading}
                className="h-11 flex-1 gap-2 rounded-full border-white/50 bg-white/50 backdrop-blur-md sm:h-10"
              >
                {renewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                Renew
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                className="h-11 flex-1 gap-2 rounded-full text-destructive hover:bg-destructive/10 sm:h-10"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            onClick={renew}
            disabled={renewLoading}
            className={cn(
              CTA_GRADIENT,
              "min-h-11 w-full gap-2 rounded-full font-semibold",
            )}
          >
            {renewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            {renewLoading ? "Connecting…" : "Rent again"}
          </Button>
        )}
      </CardFooter>

      {/* Cancel confirmation — no refund for remaining time (§7.3). */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this rental?</AlertDialogTitle>
            <AlertDialogDescription>
              The {rental.model} will be deactivated immediately. No refund is
              issued for the remaining time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>
              No, keep it
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancelLoading}
              onClick={cancel}
            >
              {cancelLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {cancelLoading ? "Canceling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
