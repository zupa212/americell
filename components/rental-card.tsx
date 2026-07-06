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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShineBorder } from "@/components/ui/shine-border";
import { BorderBeam } from "@/components/ui/border-beam";
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

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";
const glassHover =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/** CellGods statuses that entitle a live rental (§5.4: `pooled` ≈ active). */
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/** Greek label for a billing period. */
function periodLabel(period: string): string {
  switch (period) {
    case "daily":
      return "Ημέρα";
    case "weekly":
      return "Εβδομάδα";
    case "monthly":
      return "Μήνας";
    default:
      return period;
  }
}

/** Status → Badge variant + Greek label. */
function statusBadge(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  switch (status) {
    case "active":
    case "pooled":
      return { variant: "default", label: "ενεργή" };
    case "pending_payment":
      return { variant: "secondary", label: "εκκρεμεί πληρωμή" };
    case "paid":
      return { variant: "secondary", label: "επεξεργασία" };
    case "activating":
      return { variant: "secondary", label: "ενεργοποίηση…" };
    case "activation_pending_credit":
      return { variant: "destructive", label: "σε αναμονή" };
    case "refunded":
      return { variant: "outline", label: "επιστροφή χρημάτων" };
    case "expired":
      return { variant: "outline", label: "έληξε" };
    case "deactivated":
      return { variant: "outline", label: "ακυρωμένη" };
    default:
      return { variant: "secondary", label: status };
  }
}

/** Human Greek countdown for a positive duration in ms. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "Έληξε";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days >= 1) return `${days}η ${hours}ω ${minutes}λ`;
  if (hours >= 1) return `${hours}ω ${minutes}λ ${seconds}δ`;
  return `${minutes}λ ${seconds}δ`;
}

export default function RentalCard({ rental }: { rental: RentalCardData }) {
  const router = useRouter();

  const isActive = ACTIVE_STATUSES.has(rental.status);
  const isIphone = rental.platform === "iphone";

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
        toast.error("Δεν έχεις πρόσβαση σε αυτή τη συσκευή.");
      } else if (res.status === 410) {
        toast.error("Η ενοικίαση έχει λήξει.");
      } else {
        toast.error(data.error ?? "Δεν ήταν δυνατή η ανάκτηση του PIN.");
      }
    } catch {
      toast.error("Σφάλμα δικτύου. Δοκίμασε ξανά.");
    } finally {
      setPinLoading(false);
    }
  }

  async function copyPin() {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      toast.success("Το PIN αντιγράφηκε.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Δεν ήταν δυνατή η αντιγραφή.");
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
        toast.error("Η σύνδεσή σου έληξε — μπες ξανά.");
      } else if (res.status === 409) {
        toast.error("Η συσκευή μόλις δεσμεύτηκε από άλλον.");
      } else {
        toast.error(data.error ?? "Δεν ήταν δυνατή η ανανέωση.");
      }
    } catch {
      toast.error("Σφάλμα δικτύου. Δοκίμασε ξανά.");
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
        toast.success("Η ενοικίαση ακυρώθηκε.");
        setCancelOpen(false);
        router.refresh();
        return;
      }
      if (res.status === 403) {
        toast.error("Δεν έχεις πρόσβαση σε αυτή τη συσκευή.");
      } else {
        toast.error(data.error ?? "Δεν ήταν δυνατή η ακύρωση.");
      }
    } catch {
      toast.error("Σφάλμα δικτύου. Δοκίμασε ξανά.");
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <Card className={cn("relative h-full", glassCard, glassHover)}>
      {isActive ? (
        <>
          <ShineBorder
            className="rounded-3xl"
            borderWidth={1}
            duration={14}
            shineColor={["var(--color-brand)", "var(--color-brand-2)"]}
          />
          <BorderBeam
            size={80}
            duration={10}
            colorFrom="var(--color-brand)"
            colorTo="var(--color-brand-2)"
          />
        </>
      ) : null}

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-4 w-4 text-brand" aria-hidden="true" />
          {rental.model}
        </CardTitle>
        <CardAction>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </CardAction>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            {isIphone ? "iPhone" : "Android"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {periodLabel(rental.billingPeriod)} · {fmtMoney(rental.retailCents)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {isActive ? (
          <>
            {/* Live expiry countdown */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-sm backdrop-blur-md">
              <Clock className="h-4 w-4 text-brand" aria-hidden="true" />
              <span className="text-muted-foreground">Λήγει σε</span>
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
                    ? "border-emerald-300/60 bg-emerald-50/60 text-emerald-700"
                    : "border-amber-300/60 bg-amber-50/60 text-amber-700",
                )}
              >
                {tokenFresh ? (
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {tokenFresh ? (
                  <span>Ζωντανός σύνδεσμος — άνοιξε απευθείας.</span>
                ) : (
                  <span>Βάλε το PIN για να ανοίξει η συσκευή.</span>
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
                <KeyRound className="h-4 w-4 text-brand" aria-hidden="true" />
                <span className="font-mono text-base font-semibold tracking-[0.3em] text-foreground">
                  {pin}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Αντιγράφηκε
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Αντιγραφή
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
                className="h-10 w-full justify-start gap-2 rounded-2xl border-white/50 bg-white/50 backdrop-blur-md"
              >
                {pinLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                )}
                {pinLoading ? "Ανάκτηση…" : "Εμφάνιση PIN"}
              </Button>
            )}
          </>
        ) : rental.status === "refunded" ? (
          <p className="rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-sm text-muted-foreground backdrop-blur-md">
            Επιστροφή χρημάτων — δοκίμασε ξανά.
          </p>
        ) : rental.status === "activation_pending_credit" ? (
          <p className="rounded-2xl border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-amber-700 backdrop-blur-md">
            Η ενεργοποίηση καθυστερεί — θα ολοκληρωθεί σύντομα.
          </p>
        ) : (
          <p className="rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-sm text-muted-foreground backdrop-blur-md">
            {periodLabel(rental.billingPeriod)} · {fmtMoney(rental.retailCents)}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-white/40 bg-transparent">
        {isActive ? (
          <>
            <RemoteControlButton rentalId={rental.id} />
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={renew}
                disabled={renewLoading}
                className="h-10 flex-1 gap-2 rounded-full border-white/50 bg-white/50 backdrop-blur-md"
              >
                {renewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                Ανανέωση
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                className="h-10 flex-1 gap-2 rounded-full text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Ακύρωση
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            onClick={renew}
            disabled={renewLoading}
            className={cn(
              "group relative h-11 w-full gap-2 overflow-hidden rounded-full",
              "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-sm font-semibold text-white",
              "border border-white/30 ring-1 ring-white/20 backdrop-blur-xl",
              "shadow-[0_10px_40px_-12px_rgba(43,107,255,0.45)]",
              "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.55)]",
              "disabled:translate-y-0 disabled:opacity-80",
            )}
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {renewLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              {renewLoading ? "Σύνδεση…" : "Ενοικίασε ξανά"}
            </span>
          </Button>
        )}
      </CardFooter>

      {/* Cancel confirmation — no refund for remaining time (§7.3). */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ακύρωση ενοικίασης;</AlertDialogTitle>
            <AlertDialogDescription>
              Η {rental.model} θα απενεργοποιηθεί άμεσα. Δεν γίνεται επιστροφή
              χρημάτων για τον χρόνο που απομένει.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>
              Όχι, κράτησέ τη
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
              {cancelLoading ? "Ακύρωση…" : "Ναι, ακύρωσε"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
