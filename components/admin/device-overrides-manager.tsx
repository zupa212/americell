"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Override = { phoneId: string; pct: number };

/**
 * Per-device markup overrides. A device with an override uses its own markup %
 * instead of the global one — for both browse and checkout. Reads/writes via
 * /api/admin/overrides; the phone_id is copyable from the Inventory page.
 */
export default function DeviceOverridesManager({
  overrides,
}: {
  overrides: Override[];
}) {
  const router = useRouter();
  const [phoneId, setPhoneId] = useState("");
  const [pct, setPct] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const add = async () => {
    const id = phoneId.trim();
    const pctN = Math.round(Number(pct));
    if (!id || !Number.isFinite(pctN) || pctN < 0) {
      toast.error("Enter a phone ID and a valid markup %.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phoneId: id, pct: pctN }),
      });
      if (res.ok) {
        toast.success("Override saved.");
        setPhoneId("");
        setPct("");
        router.refresh();
      } else {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(d.error ?? "Couldn't save the override.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    setRemoving(id);
    try {
      const res = await fetch("/api/admin/overrides", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phoneId: id }),
      });
      if (res.ok) {
        toast.success("Override removed.");
        router.refresh();
      } else {
        toast.error("Couldn't remove the override.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {overrides.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {overrides.map((o) => (
            <li
              key={o.phoneId}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/50 bg-white/50 px-3 py-2 backdrop-blur-md"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground" title={o.phoneId}>
                {o.phoneId}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-brand">
                +{o.pct}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(o.phoneId)}
                disabled={removing === o.phoneId}
                aria-label={`Remove override for ${o.phoneId}`}
                className="h-8 gap-1.5"
              >
                {removing === o.phoneId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No per-device overrides — every device uses the global markup above.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="ov-phone">Device phone ID</Label>
          <Input
            id="ov-phone"
            value={phoneId}
            onChange={(e) => setPhoneId(e.target.value)}
            placeholder="copy from Inventory"
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ov-pct">Markup %</Label>
          <Input
            id="ov-pct"
            inputMode="numeric"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="e.g. 80"
            className={cn("w-full sm:w-28")}
          />
        </div>
        <Button type="button" onClick={add} disabled={adding} className="gap-2">
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}
