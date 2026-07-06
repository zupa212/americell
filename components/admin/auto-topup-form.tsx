"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Info, Repeat, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LottiePlayer from "@/components/ui/lottie";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AutoTopup } from "@/lib/cellgods";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Auto top-up settings (RESELLER_PLAN §6.4). The Switch is disabled unless
 * CellGods reports a `payment_method_on_file`. Threshold + amount are entered in
 * dollars and POSTed as integer cents to `/api/admin/auto-topup`; on success we
 * `router.refresh()` so the server re-reads the authoritative config.
 */

const MIN_AMOUNT_CENTS = 500; // $5

function centsToDollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "";
}

const glassField =
  "border-white/50 bg-white/60 backdrop-blur-md dark:bg-input/30";

export default function AutoTopupForm({ autoTopup }: { autoTopup: AutoTopup }) {
  const router = useRouter();
  const hasCard = autoTopup.payment_method_on_file ?? false;

  // Prop-derived baseline: after a successful save + refresh the server prop
  // matches these, so `dirty` flips back to false without a manual reset.
  const initialThreshold = centsToDollars(autoTopup.threshold_cents);
  const initialAmount = centsToDollars(autoTopup.amount_cents);

  const [enabled, setEnabled] = useState(autoTopup.enabled);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [amount, setAmount] = useState(initialAmount);
  const [saving, setSaving] = useState(false);

  const thresholdNum = Number(threshold);
  const amountNum = Number(amount);
  const thresholdCents = Math.round(
    (Number.isFinite(thresholdNum) ? thresholdNum : -1) * 100,
  );
  const amountCents = Math.round(
    (Number.isFinite(amountNum) ? amountNum : -1) * 100,
  );

  // Enabling requires sane values; a disabled config can be saved as-is.
  const invalid =
    enabled && (thresholdCents < 0 || amountCents < MIN_AMOUNT_CENTS);

  const dirty =
    enabled !== autoTopup.enabled ||
    threshold !== initialThreshold ||
    amount !== initialAmount;

  const showPreview = enabled && !invalid && thresholdCents >= 0;

  async function save() {
    if (saving || invalid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/auto-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          threshold_cents: Math.max(thresholdCents, 0),
          amount_cents: Math.max(amountCents, 0),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        toast.success("Settings saved.");
        router.refresh();
      } else {
        toast.error(data.error ?? "Couldn't save.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-col gap-5">
        {/* Header + switch */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/50 bg-white/50 p-4 backdrop-blur-md dark:bg-white/5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-xl border border-white/50 bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand">
                <Repeat className="size-4" aria-hidden="true" />
              </span>
              <Label htmlFor="auto-topup-switch" className="text-base">
                Automatic credit top-up
              </Label>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      className="cursor-help text-muted-foreground"
                      aria-label="How auto top-up works"
                    >
                      <Info className="size-3.5" aria-hidden="true" />
                    </span>
                  }
                />
                <TooltipContent>
                  CellGods watches the balance and charges the stored card the
                  moment it dips below your threshold.
                </TooltipContent>
              </Tooltip>
              <Badge
                variant={enabled ? "secondary" : "outline"}
                className={cn(
                  "ml-1",
                  enabled &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
                )}
              >
                {enabled ? "On" : "Off"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              When the balance falls below the threshold, CellGods automatically
              charges the card on file — so activations never stall.
            </p>
          </div>
          <Switch
            id="auto-topup-switch"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!hasCard}
          />
        </div>

        {!hasCard && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800 backdrop-blur-md dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            <CreditCard className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>
              No card on file. Add credit once so a card is stored and auto
              top-up can be enabled.
            </span>
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-threshold">Trigger threshold (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="auto-threshold"
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={threshold}
                disabled={!enabled}
                onChange={(e) => setThreshold(e.target.value)}
                className={cn("pl-6", glassField)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-amount">Top-up amount (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="auto-amount"
                type="number"
                min={MIN_AMOUNT_CENTS / 100}
                step="1"
                inputMode="decimal"
                value={amount}
                disabled={!enabled}
                onChange={(e) => setAmount(e.target.value)}
                className={cn("pl-6", glassField)}
              />
            </div>
          </div>
        </div>

        {invalid ? (
          <p className="flex items-center gap-1.5 text-xs text-rose-600">
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            Set a valid threshold and top-up amount (minimum{" "}
            {fmtMoney(MIN_AMOUNT_CENTS)}).
          </p>
        ) : showPreview ? (
          <p className="rounded-xl border border-white/50 bg-white/50 px-3 py-2.5 text-xs text-foreground backdrop-blur-md dark:bg-white/5">
            When the balance drops below{" "}
            <span className="font-semibold text-brand">
              {fmtMoney(Math.max(thresholdCents, 0))}
            </span>
            , CellGods charges{" "}
            <span className="font-semibold text-emerald-600">
              +{fmtMoney(Math.max(amountCents, 0))}
            </span>{" "}
            to the card on file.
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            onClick={save}
            disabled={saving || invalid || !hasCard || !dirty}
            className="min-w-36"
          >
            {saving ? (
              <>
                <LottiePlayer
                  src="/lottie/loader.json"
                  className="size-4"
                  loop
                />
                Saving…
              </>
            ) : dirty ? (
              "Save settings"
            ) : (
              "Saved"
            )}
          </Button>
          {dirty && !saving && (
            <span className="text-xs text-muted-foreground">
              You have unsaved changes.
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
