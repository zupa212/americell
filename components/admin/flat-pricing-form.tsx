"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "flat" | "margin";

/**
 * Owner control for FIXED per-platform pricing (€/month per device type).
 * Writes the singleton reseller_settings via /api/admin/flat-pricing; both
 * browse and checkout read it, so a change re-prices every device instantly.
 * Daily/weekly are derived from the monthly price (constant per-day rate).
 */
export default function FlatPricingForm({
  current,
}: {
  current: {
    mode: Mode;
    currency: string;
    androidMonthlyCents: number;
    iphoneMonthlyCents: number;
  };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(current.mode);
  const [currency, setCurrency] = useState(current.currency.toLowerCase());
  const [android, setAndroid] = useState(
    (current.androidMonthlyCents / 100).toFixed(0),
  );
  const [iphone, setIphone] = useState(
    (current.iphoneMonthlyCents / 100).toFixed(0),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const androidMonthlyCents = Math.round(Number(android) * 100);
    const iphoneMonthlyCents = Math.round(Number(iphone) * 100);
    if (
      !Number.isFinite(androidMonthlyCents) ||
      androidMonthlyCents < 0 ||
      !Number.isFinite(iphoneMonthlyCents) ||
      iphoneMonthlyCents < 0
    ) {
      toast.error("Enter valid prices.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/flat-pricing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          currency,
          androidMonthlyCents,
          iphoneMonthlyCents,
        }),
      });
      if (res.ok) {
        toast.success("Pricing updated — applies to every device now.");
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
    "h-10 w-full rounded-lg border border-white/50 bg-white/60 px-3 text-sm text-foreground outline-none backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:w-56",
  );
  const sym = currency === "eur" ? "€" : currency === "usd" ? "$" : currency.toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="flat-mode">Pricing mode</Label>
          <select
            id="flat-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className={selectClass}
          >
            <option value="flat">Fixed price per device type</option>
            <option value="margin">Wholesale + margin</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="flat-currency">Currency</Label>
          <select
            id="flat-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={selectClass}
          >
            <option value="eur">EUR (€)</option>
            <option value="usd">USD ($)</option>
          </select>
        </div>
      </div>

      <div className={cn("grid gap-4 sm:grid-cols-2", mode === "margin" && "opacity-50")}>
        <div className="space-y-1.5">
          <Label htmlFor="flat-android">Android — price / month</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {sym}
            </span>
            <Input
              id="flat-android"
              inputMode="numeric"
              value={android}
              onChange={(e) => setAndroid(e.target.value)}
              disabled={mode === "margin"}
              className="pl-7"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="flat-iphone">iPhone — price / month</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {sym}
            </span>
            <Input
              id="flat-iphone"
              inputMode="numeric"
              value={iphone}
              onChange={(e) => setIphone(e.target.value)}
              disabled={mode === "margin"}
              className="pl-7"
            />
          </div>
        </div>
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
        In fixed mode, every Android and every iPhone is sold at these prices —
        daily/weekly are derived from the monthly price. Browse and checkout both
        read this, so the shown price equals the charged price.
      </p>
    </div>
  );
}
