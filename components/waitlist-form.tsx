"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const FLEET_OPTIONS = ["1", "2-5", "6-25", "26-100", "100+"];

/**
 * Standalone waitlist / early-access form (no offer, no countdown). Captures a
 * work email + desired fleet size to /api/leads (source: waitlist_page), same
 * store the homepage popup feeds and the admin Leads list shows.
 */
export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [fleet, setFleet] = useState("2-5");
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
          fleetSize: fleet,
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
          Thanks — we&rsquo;ll reach out about deploying your fleet of real US
          iPhones &amp; Android devices.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="wl-email" className="text-white/80">
          Work email
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
          placeholder="you@company.com"
          className="h-11 border-white/15 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wl-fleet" className="text-white/80">
          How many phones do you need?
        </Label>
        <select
          id="wl-fleet"
          value={fleet}
          onChange={(e) => setFleet(e.target.value)}
          className={cn(
            "h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          )}
        >
          {FLEET_OPTIONS.map((o) => (
            <option key={o} value={o} className="text-black">
              {o} {o === "1" ? "phone" : "phones"}
            </option>
          ))}
        </select>
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
