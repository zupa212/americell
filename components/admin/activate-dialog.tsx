"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LottiePlayer from "@/components/ui/lottie";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Type-only imports from a `server-only` module — erased at build, never bundled.
import type { BillingPeriod } from "@/lib/cellgods";

/** The phone the dialog is activating (null = closed). */
export type ActivatePhone = {
  phoneId: string;
  model: string;
  currency: string;
};

type DurationOption = {
  period: BillingPeriod;
  days: number;
  label: string;
};

/** Shape of a successful `/api/admin/orders/activate` response (mirrors ActivateResult). */
type ActivateResult = {
  order_id: string;
  pin: string;
  stream_url: string;
  expires_at: string;
  charged_cents: number;
  billing_period: string;
  credit_balance_cents: number;
  currency: string;
};

type ActivateDialogProps = {
  phone: ActivatePhone | null;
  durations: readonly DurationOption[];
  onClose: () => void;
};

// Frosted-glass surface recipe — matches the rest of the cockpit.
const GLASS_PANEL =
  "rounded-2xl border border-white/50 bg-white/50 ring-1 ring-white/40 backdrop-blur-md";

/**
 * ActivateDialog — admin manual activation (RESELLER_PLAN §6.4).
 *
 * Collects `customer_email` + `billing_period` (which seeds `duration_days`) and
 * POSTs `{ phone_id, customer_email, duration_days, billing_period }` to the
 * owner-only proxy. On success it surfaces the minted `order_id` / PIN /
 * `stream_url` / `charged_cents` / new balance and the 4h token warning, then
 * `router.refresh()`es the inventory once the dialog closes so the now-reserved
 * phone drops out of the available list. Now full-glass with a Lottie loader
 * while the activation is in flight — all data flow is unchanged.
 */
export default function ActivateDialog({
  phone,
  durations,
  onClose,
}: ActivateDialogProps) {
  const router = useRouter();
  const open = phone != null;

  const defaultPeriod: BillingPeriod =
    durations.find((d) => d.period === "monthly")?.period ??
    durations[0]?.period ??
    "monthly";
  const defaultDays =
    durations.find((d) => d.period === defaultPeriod)?.days ?? 30;

  const [email, setEmail] = useState("");
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod);
  const [days, setDays] = useState<number>(defaultDays);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ActivateResult | null>(null);

  // The form is reset by remounting: the parent keys this component by the
  // target phone id, so every phone opens a fresh instance with the initial
  // state above (no reset-in-effect needed).

  const succeeded = result != null;

  function handleOpenChange(next: boolean) {
    if (next) return;
    onClose();
    // A successful activation reserves the phone → reflect it in the table.
    if (succeeded) router.refresh();
  }

  function selectPeriod(next: BillingPeriod) {
    setPeriod(next);
    const match = durations.find((d) => d.period === next);
    if (match) setDays(match.days);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || pending) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone_id: phone.phoneId,
          customer_email: email.trim(),
          duration_days: days,
          billing_period: period,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Server error");
        return;
      }
      setResult(data as ActivateResult);
      toast.success("Activation complete.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Couldn't copy.");
    }
  }

  const canSubmit = email.trim().length > 0 && days >= 1 && !pending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "gap-5 rounded-3xl border-white/50 bg-white/70 ring-white/40 shadow-[0_20px_70px_-20px_rgba(30,41,120,0.35)] backdrop-blur-2xl sm:max-w-md",
          "dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/10",
        )}
      >
        {result ? (
          <TooltipProvider delay={200}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className="relative inline-flex">
                  <LottiePlayer
                    src="/lottie/pulse.json"
                    className="absolute -inset-1.5 opacity-70"
                  />
                  <CheckCircle2
                    className="relative size-5 text-emerald-500"
                    aria-hidden
                  />
                </span>
                Activated
              </DialogTitle>
              <DialogDescription>
                {phone?.model} — hand the details below to the customer.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <ResultRow label="Order ID">
                <span className="font-mono text-xs break-all">
                  {result.order_id}
                </span>
                <CopyButton onClick={() => copy(result.order_id, "Order ID")} />
              </ResultRow>

              <ResultRow label="PIN">
                <span className="inline-flex items-center gap-1.5 font-mono text-base font-semibold tracking-widest">
                  <KeyRound className="size-4 text-brand" aria-hidden />
                  {result.pin}
                </span>
                <CopyButton onClick={() => copy(result.pin, "PIN")} />
              </ResultRow>

              <ResultRow label="Control link">
                <a
                  href={result.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
                >
                  Open stream
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <CopyButton onClick={() => copy(result.stream_url, "Link")} />
              </ResultRow>

              <div className="grid grid-cols-2 gap-3">
                <div className={cn("p-3", GLASS_PANEL)}>
                  <p className="text-xs text-muted-foreground">Charged</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {fmtMoney(result.charged_cents, result.currency)}
                  </p>
                </div>
                <div className={cn("p-3", GLASS_PANEL)}>
                  <p className="text-xs text-muted-foreground">New balance</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {fmtMoney(result.credit_balance_cents, result.currency)}
                  </p>
                </div>
              </div>

              <p className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                The link expires in 4 hours — after that, re-enter the PIN for a
                new link.
              </p>

              <Button
                type="button"
                className="mt-1 w-full bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </TooltipProvider>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl text-brand",
                    GLASS_PANEL,
                  )}
                >
                  <Smartphone className="size-4" aria-hidden />
                </span>
                Activate device
              </DialogTitle>
              <DialogDescription>
                {phone?.model} — create a rental for a customer.
              </DialogDescription>
            </DialogHeader>

            <Separator className="bg-white/50" />

            <div className="flex flex-col gap-2">
              <Label htmlFor="activate-email">Customer email</Label>
              <Input
                id="activate-email"
                type="email"
                required
                autoComplete="off"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                className="border-white/50 bg-white/50 ring-1 ring-white/30 backdrop-blur-md"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Billing period</Label>
              <Tabs
                value={period}
                onValueChange={(v) => selectPeriod(v as BillingPeriod)}
              >
                <TabsList className="w-full border border-white/50 bg-white/40 ring-1 ring-white/30 backdrop-blur-md">
                  {durations.map((d) => (
                    <TabsTrigger
                      key={d.period}
                      value={d.period}
                      className="flex-1"
                      disabled={pending}
                    >
                      {d.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="activate-days">Duration (days)</Label>
              <Input
                id="activate-days"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(Math.floor(Number(e.target.value)))}
                disabled={pending}
                className="border-white/50 bg-white/50 ring-1 ring-white/30 backdrop-blur-md"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
                className="border-white/50 bg-white/50 backdrop-blur-md hover:bg-white/70"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="gap-2 bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90"
              >
                {pending ? (
                  <>
                    <LottiePlayer
                      src="/lottie/loader.json"
                      className="size-4"
                    />
                    Activating…
                  </>
                ) : (
                  "Activate"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1 p-3", GLASS_PANEL)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-3">{children}</div>
    </div>
  );
}

function CopyButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            aria-label="Copy"
            className={cn("shrink-0 text-muted-foreground hover:text-foreground")}
          />
        }
      >
        <Copy className="size-4" aria-hidden />
      </TooltipTrigger>
      <TooltipContent>Copy</TooltipContent>
    </Tooltip>
  );
}
