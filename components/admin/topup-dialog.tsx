"use client";

import { type ComponentProps, useMemo, useState } from "react";
import { CreditCard, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LottiePlayer from "@/components/ui/lottie";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Top-up dialog (RESELLER_PLAN §6.4). Collects a dollar amount (min $5), converts
 * to integer cents, POSTs `/api/admin/topup`, then hands the browser off to the
 * returned CellGods hosted Stripe Checkout `checkout_url` — the CellGods Stripe
 * surface that funds reseller credit (NOT the customer retail surface).
 *
 * Presentation-only props (`label`/`variant`/`size`/`className`) let the same
 * dialog render as the hero CTA and the Settings-tab button; the network
 * behaviour is unchanged.
 */

const MIN_DOLLARS = 5;
const MIN_CENTS = MIN_DOLLARS * 100;
const PRESETS = [25, 50, 100, 250];

const glassSurface =
  "border-white/50 bg-white/70 ring-1 ring-white/40 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(30,41,120,0.35)]";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

export default function TopupDialog({
  label = "Add credit",
  variant = "default",
  size = "default",
  className,
}: {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dollars, setDollars] = useState("50");
  const [loading, setLoading] = useState(false);

  const parsedDollars = Number(dollars);
  const amountCents = Math.round(
    (Number.isFinite(parsedDollars) ? parsedDollars : 0) * 100,
  );
  const valid = amountCents >= MIN_CENTS;
  const touched = dollars.trim() !== "";

  const presetMatch = useMemo(
    () => PRESETS.find((p) => p * 100 === amountCents) ?? null,
    [amountCents],
  );

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        checkout_url?: string;
        error?: string;
      };
      if (res.ok && data.checkout_url) {
        // Hand off to CellGods' hosted Stripe Checkout; keep the spinner while
        // the navigation happens.
        window.location.assign(data.checkout_url);
        return;
      }
      toast.error(data.error ?? "Couldn't add credit.");
      setLoading(false);
    } catch {
      toast.error("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={variant} size={size} className={className} />}
      >
        <Plus aria-hidden="true" />
        {label}
      </DialogTrigger>

      <DialogContent className={cn("sm:max-w-md", glassSurface)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-xl border border-white/50 bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand">
              <CreditCard className="size-4" aria-hidden="true" />
            </span>
            Add credit
          </DialogTitle>
          <DialogDescription>
            You&apos;ll be taken to CellGods&apos; secure Stripe Checkout for the
            charge. Minimum {fmtMoney(MIN_CENTS)}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => {
              const active = presetMatch === p;
              return (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setDollars(String(p))}
                  className={cn(
                    !active &&
                      "border-white/50 bg-white/60 backdrop-blur-md dark:bg-input/30",
                  )}
                >
                  {fmtMoney(p * 100)}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topup-amount">Custom amount (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="topup-amount"
                type="number"
                min={MIN_DOLLARS}
                step="1"
                inputMode="decimal"
                value={dollars}
                onChange={(e) => setDollars(e.target.value)}
                className="border-white/50 bg-white/60 pl-6 backdrop-blur-md dark:bg-input/30"
              />
            </div>
            {!valid && touched ? (
              <p className="text-xs text-rose-600">
                The minimum amount is {fmtMoney(MIN_CENTS)}.
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Processed securely by Stripe. A card gets stored for auto top-up.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className={cn("border-white/40", glassSurface)}>
          <Button
            onClick={submit}
            disabled={!valid || loading}
            className="min-w-36"
          >
            {loading ? (
              <>
                <LottiePlayer
                  src="/lottie/loader.json"
                  className="size-4"
                  loop
                />
                Redirecting…
              </>
            ) : (
              <>
                <CreditCard aria-hidden="true" />
                {valid ? `Pay ${fmtMoney(amountCents)}` : "Enter an amount"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
