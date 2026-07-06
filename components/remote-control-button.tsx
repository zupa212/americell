"use client";

import { useState } from "react";
import { Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shape returned by `GET /api/rentals/[id]/access` (RESELLER_PLAN §5.5E). The
 * route only READS the stored 4h token URL — it NEVER re-calls CellGods
 * `activate`, so opening the control spends no reseller credit and mints no
 * duplicate order. The PIN is deliberately NOT part of this payload; it is
 * served separately from `/api/rentals/[id]/pin`.
 */
type AccessResponse = {
  streamUrl?: string;
  expiresAt?: string;
  tokenFresh?: boolean;
  tokenExpiresAt?: string;
  error?: string;
};

/**
 * "Άνοιξε τηλεχειρισμό" — opens the CellGods stream page for a rental in a NEW
 * tab. Thin, reusable button: fetches the entitlement (`/access`) and, on
 * success, pops the stored `streamUrl`. Ownership is re-checked server-side; a
 * 403/410 surfaces a Greek toast. Never re-activates.
 */
export default function RemoteControlButton({
  rentalId,
  className,
  label = "Άνοιξε τηλεχειρισμό",
}: {
  rentalId: string;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function openControl() {
    setLoading(true);
    try {
      // Read-only GET — reads the stored 4h token, never re-mints/re-activates.
      const res = await fetch(`/api/rentals/${rentalId}/access`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as AccessResponse;

      if (res.ok && data.streamUrl) {
        // New tab; the dashboard stays put. noopener/noreferrer for safety.
        window.open(data.streamUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (res.status === 401) {
        toast.error("Η σύνδεσή σου έληξε — μπες ξανά.");
      } else if (res.status === 403) {
        toast.error("Δεν έχεις πρόσβαση σε αυτή τη συσκευή.");
      } else if (res.status === 410) {
        toast.error("Η ενοικίαση έχει λήξει.");
      } else {
        toast.error(
          data.error ?? "Δεν ήταν δυνατό το άνοιγμα του τηλεχειρισμού.",
        );
      }
    } catch {
      toast.error("Σφάλμα δικτύου. Δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={openControl}
      disabled={loading}
      className={cn(
        "group relative h-11 w-full gap-2 overflow-hidden rounded-full",
        "bg-gradient-to-r from-brand via-brand-2 to-brand-soft",
        "text-sm font-semibold text-white",
        "border border-white/30 ring-1 ring-white/20 backdrop-blur-xl",
        "shadow-[0_10px_40px_-12px_rgba(43,107,255,0.45)]",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.55)]",
        "disabled:translate-y-0 disabled:opacity-80",
        className,
      )}
    >
      {/* glossy top sheen for a frosted-glass finish */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90"
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Radio className="h-4 w-4" aria-hidden />
        )}
        {loading ? "Σύνδεση…" : label}
      </span>
    </Button>
  );
}
