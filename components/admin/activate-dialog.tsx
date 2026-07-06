"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  labelEl: string;
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

/**
 * ActivateDialog — admin manual activation (RESELLER_PLAN §6.4).
 *
 * Collects `customer_email` + `billing_period` (which seeds `duration_days`) and
 * POSTs `{ phone_id, customer_email, duration_days, billing_period }` to the
 * owner-only proxy. On success it surfaces the minted `order_id` / PIN /
 * `stream_url` / `charged_cents` / new balance and the 4h token warning, then
 * `router.refresh()`es the inventory once the dialog closes so the now-reserved
 * phone drops out of the available list.
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
        setError(
          (data as { error?: string }).error ?? "Σφάλμα διακομιστή",
        );
        return;
      }
      setResult(data as ActivateResult);
      toast.success("Η ενεργοποίηση ολοκληρώθηκε.");
    } catch {
      setError("Σφάλμα δικτύου. Δοκίμασε ξανά.");
    } finally {
      setPending(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} αντιγράφηκε.`);
    } catch {
      toast.error("Δεν ήταν δυνατή η αντιγραφή.");
    }
  }

  const canSubmit = email.trim().length > 0 && days >= 1 && !pending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />
                Ενεργοποιήθηκε
              </DialogTitle>
              <DialogDescription>
                {phone?.model} — παράδοσε τα παρακάτω στοιχεία στον πελάτη.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <ResultRow label="Αναγνωριστικό παραγγελίας">
                <span className="font-mono text-xs break-all">
                  {result.order_id}
                </span>
                <CopyButton
                  onClick={() => copy(result.order_id, "Το αναγνωριστικό")}
                />
              </ResultRow>

              <ResultRow label="PIN">
                <span className="inline-flex items-center gap-1.5 font-mono text-base font-semibold tracking-widest">
                  <KeyRound className="size-4 text-brand" aria-hidden />
                  {result.pin}
                </span>
                <CopyButton onClick={() => copy(result.pin, "Το PIN")} />
              </ResultRow>

              <ResultRow label="Σύνδεσμος ελέγχου">
                <a
                  href={result.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
                >
                  Άνοιγμα ροής
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <CopyButton
                  onClick={() => copy(result.stream_url, "Ο σύνδεσμος")}
                />
              </ResultRow>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Χρέωση</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {fmtMoney(result.charged_cents, result.currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Νέο υπόλοιπο</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {fmtMoney(result.credit_balance_cents, result.currency)}
                  </p>
                </div>
              </div>

              <p className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Clock className="size-3.5" aria-hidden />
                Ο σύνδεσμος λήγει σε 4 ώρες — μετά, βάλε ξανά το PIN για νέο σύνδεσμο.
              </p>

              <Button
                type="button"
                className="mt-1 w-full"
                onClick={() => handleOpenChange(false)}
              >
                Κλείσιμο
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Ενεργοποίηση συσκευής</DialogTitle>
              <DialogDescription>
                {phone?.model} — δημιούργησε μια ενοικίαση για έναν πελάτη.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="activate-email">Email πελάτη</Label>
              <Input
                id="activate-email"
                type="email"
                required
                autoComplete="off"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Περίοδος χρέωσης</Label>
              <Tabs
                value={period}
                onValueChange={(v) => selectPeriod(v as BillingPeriod)}
              >
                <TabsList className="w-full">
                  {durations.map((d) => (
                    <TabsTrigger
                      key={d.period}
                      value={d.period}
                      className="flex-1"
                      disabled={pending}
                    >
                      {d.labelEl}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="activate-days">Διάρκεια (ημέρες)</Label>
              <Input
                id="activate-days"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(Math.floor(Number(e.target.value)))}
                disabled={pending}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
              >
                Άκυρο
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Ενεργοποίηση…
                  </>
                ) : (
                  "Ενεργοποίηση"
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
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-3">{children}</div>
    </div>
  );
}

function CopyButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label="Αντιγραφή"
      className={cn("shrink-0 text-muted-foreground hover:text-foreground")}
    >
      <Copy className="size-4" aria-hidden />
    </Button>
  );
}
