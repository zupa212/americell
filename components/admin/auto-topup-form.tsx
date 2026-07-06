"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AutoTopup } from "@/lib/cellgods";
import { fmtMoney } from "@/lib/money";

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

export default function AutoTopupForm({ autoTopup }: { autoTopup: AutoTopup }) {
  const router = useRouter();
  const hasCard = autoTopup.payment_method_on_file ?? false;

  const [enabled, setEnabled] = useState(autoTopup.enabled);
  const [threshold, setThreshold] = useState(
    centsToDollars(autoTopup.threshold_cents),
  );
  const [amount, setAmount] = useState(centsToDollars(autoTopup.amount_cents));
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
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="auto-topup-switch" className="text-base">
            Automatic credit top-up
          </Label>
          <p className="text-sm text-muted-foreground">
            When the balance falls below the threshold, CellGods automatically
            charges the card on file.
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
        <p className="rounded-lg border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
          No card on file. Add credit once so a card is stored and auto top-up
          can be enabled.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auto-threshold">Trigger threshold (USD)</Label>
          <Input
            id="auto-threshold"
            type="number"
            min={0}
            step="1"
            inputMode="decimal"
            value={threshold}
            disabled={!enabled}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auto-amount">Top-up amount (USD)</Label>
          <Input
            id="auto-amount"
            type="number"
            min={MIN_AMOUNT_CENTS / 100}
            step="1"
            inputMode="decimal"
            value={amount}
            disabled={!enabled}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      {invalid && (
        <p className="text-xs text-rose-600">
          Set a valid threshold and top-up amount (minimum{" "}
          {fmtMoney(MIN_AMOUNT_CENTS)}).
        </p>
      )}

      <div>
        <Button onClick={save} disabled={saving || invalid || !hasCard}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
