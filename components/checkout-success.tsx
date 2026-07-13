"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/**
 * Post-payment confirmation banner.
 *
 * When the customer returns from Stripe/crypto checkout (`?checkout=success` or
 * `?crypto=success`), reassures them and auto-refreshes the dashboard until the
 * webhook-activated rental shows up below. Activation is async (the payment
 * webhook does CellGods activate + encrypt PIN), so the rental can take a few
 * seconds to appear — this closes that "did my payment work?" gap.
 *
 * Honest about lag: it only claims "ready" once an active rental actually
 * appears (or, after the poll window, if the account has an active rental);
 * otherwise it says activation is still finalizing — never a false success.
 * Renders nothing on a normal dashboard visit.
 */
export default function CheckoutSuccess({ activeCount }: { activeCount: number }) {
  const params = useSearchParams();
  const router = useRouter();

  const isSuccess =
    params.get("checkout") === "success" || params.get("crypto") === "success";
  const method = params.has("crypto") ? "crypto" : "card";

  const [visible, setVisible] = useState(true);
  const [countReady, setCountReady] = useState(false);
  const [windowDone, setWindowDone] = useState(false);

  // Active-rental count at first render — a later increase means our new phone
  // just went live.
  const baseline = useRef(activeCount);
  const started = useRef(false);
  const toasted = useRef(false);

  useEffect(() => {
    if (!isSuccess || started.current) return;
    started.current = true;
    toast.success("Payment received — activating your phone…");
    // Poll the server component a handful of times so the new rental appears
    // without the customer manually refreshing.
    const timers = [2000, 4500, 8000, 12000, 17000].map((d) =>
      setTimeout(() => router.refresh(), d),
    );
    const windowTimer = setTimeout(() => setWindowDone(true), 18000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(windowTimer);
    };
  }, [isSuccess, router]);

  // A new active rental relative to the baseline → it's live.
  useEffect(() => {
    if (isSuccess && !countReady && activeCount > baseline.current) {
      setCountReady(true);
    }
  }, [activeCount, isSuccess, countReady]);

  const ready = countReady || (windowDone && activeCount > 0);
  const pending = windowDone && !ready; // paid, but no active rental yet

  useEffect(() => {
    if (ready && !toasted.current) {
      toasted.current = true;
      toast.success("Your phone is ready 🎉");
    }
  }, [ready]);

  if (!isSuccess || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    router.replace("/dashboard");
  };

  const title = ready
    ? "Your phone is ready 🎉"
    : pending
      ? "Almost there — finalizing activation"
      : "Payment received — activating your phone…";
  const body = ready
    ? "Open “Remote control” on your rental below to start."
    : pending
      ? "This is taking a little longer than usual. Your rental will appear below the moment it’s live — you won’t be charged again."
      : `Paid by ${method}. Your rental will appear below in a few seconds.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border p-4 pr-11 ring-1 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
        ready
          ? "border-emerald-500/30 bg-emerald-50/80 ring-emerald-500/10"
          : pending
            ? "border-amber-400/40 bg-amber-50/80 ring-amber-400/10"
            : "border-white/50 bg-white/70 ring-white/40 backdrop-blur-md",
      )}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {ready ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-black/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
