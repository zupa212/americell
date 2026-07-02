"use client";

import { useState } from "react";
import { Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

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
        className="h-11 w-full gap-2 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-sm font-semibold text-white shadow-glow-brand transition-shadow duration-300 hover:shadow-xl hover:opacity-95"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Radio className="h-4 w-4" aria-hidden />
        )}
        {loading ? "Σύνδεση…" : "Άνοιξε τηλεχειρισμό"}
      </Button>
      {note ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-center text-xs text-muted-foreground"
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}
