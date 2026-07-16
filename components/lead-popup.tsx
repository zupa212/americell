"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const FLEET_OPTIONS = ["1", "2-5", "6-25", "26-100", "100+"];

/**
 * Homepage marketing popup: a 24h evergreen countdown + a lead form (email +
 * desired fleet size). Appears once, ~4s after load, and not again for 24h
 * (localStorage). Captures to /api/leads. Self-contained dark-branded styling so
 * it reads well over the dark homepage.
 */
export default function LeadPopup() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(DAY_MS / 1000);
  const [email, setEmail] = useState("");
  const [fleet, setFleet] = useState("2-5");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Show once, after a short delay, unless submitted or shown in the last 24h.
  useEffect(() => {
    if (localStorage.getItem("AC_LEAD_DONE")) return;
    const seen = Number(localStorage.getItem("AC_LEAD_SEEN") || 0);
    if (Date.now() - seen < DAY_MS) return;
    const t = setTimeout(() => {
      setOpen(true);
      localStorage.setItem("AC_LEAD_SEEN", String(Date.now()));
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // Evergreen 24h countdown (per visitor, resets when it lapses).
  useEffect(() => {
    let dl = Number(localStorage.getItem("AC_LEAD_DEADLINE") || 0);
    if (!dl || dl < Date.now()) {
      dl = Date.now() + DAY_MS;
      localStorage.setItem("AC_LEAD_DEADLINE", String(dl));
    }
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((dl - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

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
        body: JSON.stringify({ email: email.trim(), fleetSize: fleet }),
      });
      if (res.ok) {
        localStorage.setItem("AC_LEAD_DONE", "1");
        setDone(true);
        toast.success("You're on the list — we'll be in touch.");
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

  const seg = "rounded-lg bg-white/10 px-2.5 py-1.5 text-2xl font-black tabular-nums text-white ring-1 ring-white/15";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton
        className="max-w-[calc(100%-2rem)] overflow-hidden border-white/10 bg-[#0b1020]/95 p-0 text-white backdrop-blur-xl sm:max-w-md"
      >
        {/* Brand gradient banner */}
        <div className="relative bg-gradient-to-br from-brand via-brand-2 to-brand-soft px-6 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <Rocket className="h-4 w-4" aria-hidden="true" />
            Launch offer
          </div>
          <DialogTitle className="mt-1 text-2xl font-black leading-tight tracking-tight text-white">
            Lock in launch pricing for your fleet
          </DialogTitle>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden="true" />
              <p className="text-lg font-bold">You&rsquo;re on the list 🎉</p>
              <p className="text-sm text-white/70">
                We&rsquo;ll reach out about deploying your fleet.
              </p>
            </div>
          ) : (
            <>
              {/* Countdown */}
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-white/60" aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Offer ends in
                </span>
                <span className="flex items-center gap-1">
                  <span className={seg}>{hh}</span>
                  <span className="font-black text-white/40">:</span>
                  <span className={seg}>{mm}</span>
                  <span className="font-black text-white/40">:</span>
                  <span className={seg}>{ss}</span>
                </span>
              </div>

              <p className="text-center text-sm leading-relaxed text-white/70">
                Real US iPhones &amp; Android, controlled from your browser. Tell us
                your fleet size — we&rsquo;ll set you up with launch pricing.
              </p>

              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-email" className="text-white/80">
                    Work email
                  </Label>
                  <Input
                    id="lead-email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="you@company.com"
                    className="border-white/15 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-fleet" className="text-white/80">
                    How many phones do you need?
                  </Label>
                  <select
                    id="lead-fleet"
                    value={fleet}
                    onChange={(e) => setFleet(e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                    )}
                  >
                    {FLEET_OPTIONS.map((o) => (
                      <option key={o} value={o} className="text-black">
                        {o} {o === "1" ? "phone" : "phones"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:opacity-95 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Rocket className="h-4 w-4" aria-hidden="true" />
                )}
                Get early access
              </button>
              <p className="text-center text-[0.7rem] text-white/45">
                No spam — just your launch setup.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
