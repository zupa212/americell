"use client";

import { useState } from "react";
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
import { fmtMoney } from "@/lib/money";

/**
 * Top-up dialog (RESELLER_PLAN §6.4). Collects a dollar amount (min $5), converts
 * to integer cents, POSTs `/api/admin/topup`, then hands the browser off to the
 * returned CellGods hosted Stripe Checkout `checkout_url` — the CellGods Stripe
 * surface that funds reseller credit (NOT the customer retail surface).
 */

const MIN_DOLLARS = 5;
const MIN_CENTS = MIN_DOLLARS * 100;
const PRESETS = [25, 50, 100, 250];

export default function TopupDialog() {
  const [open, setOpen] = useState(false);
  const [dollars, setDollars] = useState("50");
  const [loading, setLoading] = useState(false);

  const parsedDollars = Number(dollars);
  const amountCents = Math.round(
    (Number.isFinite(parsedDollars) ? parsedDollars : 0) * 100,
  );
  const valid = amountCents >= MIN_CENTS;

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
      <DialogTrigger render={<Button />}>Add credit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add credit</DialogTitle>
          <DialogDescription>
            You&apos;ll be taken to CellGods&apos; secure Stripe Checkout for the
            charge. Minimum {fmtMoney(MIN_CENTS)}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={amountCents === p * 100 ? "default" : "outline"}
                onClick={() => setDollars(String(p))}
              >
                {fmtMoney(p * 100)}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topup-amount">Amount (USD)</Label>
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
                className="pl-6"
              />
            </div>
            {!valid && dollars.trim() !== "" && (
              <p className="text-xs text-rose-600">
                The minimum amount is {fmtMoney(MIN_CENTS)}.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={!valid || loading}>
            {loading
              ? "Redirecting…"
              : `Pay ${valid ? fmtMoney(amountCents) : ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
