"use client";

import { useState } from "react";
import { Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RemoteControlButton({ deviceId }: { deviceId: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function openControl() {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}/unlock`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sessionUrl?: string;
        configured?: boolean;
        message?: string;
        error?: string;
      };

      if (res.ok && data.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl;
        return;
      }
      if (res.ok && data.configured === false) {
        setNote(
          data.message ?? "Ο πάροχος τηλεχειρισμού δεν έχει ρυθμιστεί ακόμη.",
        );
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
    <div>
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
          {loading ? "Σύνδεση…" : "Άνοιξε τηλεχειρισμό"}
        </span>
      </Button>
      {note ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-2 rounded-2xl border border-white/50 bg-white/60 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur-md",
          )}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}
