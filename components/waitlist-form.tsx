"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type WaitlistDevice = { model: string; platform: string };

// Fallback choices only when the live catalog is momentarily empty.
const FALLBACK: WaitlistDevice[] = [
  { model: "iPhone", platform: "iphone" },
  { model: "Android", platform: "android" },
];

/**
 * Standalone waitlist / early-access form. Pick the SPECIFIC phone you want
 * (from the live catalog) + your email → /api/leads (source: waitlist_page),
 * same store the admin Leads list shows.
 */
export default function WaitlistForm({ devices }: { devices: WaitlistDevice[] }) {
  const options = devices.length > 0 ? devices : FALLBACK;
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState(options[0]?.model ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          fleetSize: device, // the specific phone they want
          source: "waitlist_page",
        }),
      });
      if (res.ok) {
        setDone(true);
        toast.success("You're on the waitlist — we'll be in touch.");
      } else {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(d.error ?? "Couldn't submit. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-11 w-11 text-emerald-400" aria-hidden="true" />
        <p className="text-xl font-bold text-white">You&rsquo;re on the waitlist 🎉</p>
        <p className="max-w-xs text-sm text-white/70">
          Thanks — we&rsquo;ll reach out about your{" "}
          <span className="font-semibold text-white">{device}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="wl-device" className="text-white/80">
          Which phone do you want?
        </Label>
        <select
          id="wl-device"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          className={cn(
            "h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          )}
        >
          {options.map((o) => (
            <option key={o.model} value={o.model} className="text-black">
              {o.model}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wl-email" className="text-white/80">
          Email
        </Label>
        <Input
          id="wl-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="you@email.com"
          className="h-11 border-white/15 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:opacity-95 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Rocket className="h-4 w-4" aria-hidden="true" />
        )}
        Join the waitlist
      </button>
      <p className="text-center text-[0.72rem] text-white/45">
        No spam — just your launch setup.
      </p>
    </div>
  );
}
