"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Percent, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Rounding = "whole" | "psychological" | "none";

/**
 * Owner control for the resale margin. Writes the single-row reseller_settings
 * config via /api/admin/settings; `getMarginOpts()` reads it for BOTH browse and
 * checkout, so a change here re-prices every device instantly and consistently.
 */
export default function PricingSettingsForm({
  current,
}: {
  current: { pct: number; minCents: number; rounding: Rounding };
}) {
  const router = useRouter();
  const [pct, setPct] = useState(String(current.pct));
  const [minDollars, setMinDollars] = useState(
    (current.minCents / 100).toFixed(2),
  );
  const [rounding, setRounding] = useState<Rounding>(current.rounding);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const pctN = Math.round(Number(pct));
    const minCents = Math.round(Number(minDollars) * 100);
    if (
      !Number.isFinite(pctN) ||
      pctN < 0 ||
      !Number.isFinite(minCents) ||
      minCents < 0
    ) {
      toast.error("Enter valid numbers.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pct: pctN, minCents, rounding }),
      });
      if (res.ok) {
        toast.success("Resale pricing updated — applies to every device now.");
        router.refresh();
      } else {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(d.error ?? "Couldn't save pricing.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectClass = cn(
    "h-10 w-full rounded-lg border border-white/50 bg-white/60 px-3 text-sm text-foreground outline-none backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:w-72",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="margin-pct">Markup over wholesale (%)</Label>
          <div className="relative">
            <Input
              id="margin-pct"
              inputMode="numeric"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              className="pr-9"
            />
            <Percent
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            e.g. 50 → sell at wholesale + 50%.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="margin-min">Minimum markup ($)</Label>
          <Input
            id="margin-min"
            inputMode="decimal"
            value={minDollars}
            onChange={(e) => setMinDollars(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Never mark up less than this.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="margin-rounding">Price rounding</Label>
        <select
          id="margin-rounding"
          value={rounding}
          onChange={(e) => setRounding(e.target.value as Rounding)}
          className={selectClass}
        >
          <option value="whole">Whole dollars ($90)</option>
          <option value="psychological">Psychological ($89.99)</option>
          <option value="none">Exact cents</option>
        </select>
      </div>

      <div>
        <Button type="button" onClick={save} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Save pricing
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Applies to every device instantly — the price customers see and the price
        they&rsquo;re charged both read this. Wholesale cost never leaves the server.
      </p>
    </div>
  );
}
