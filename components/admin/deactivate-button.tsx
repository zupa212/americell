"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PowerOff, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Owner-only "deactivate order" control (RESELLER_PLAN §6.3, §6.4).
 *
 * Wraps a destructive AlertDialog whose copy makes the money-safety rule
 * explicit: deactivating releases the phone on CellGods but issues NO refund
 * (§7.3 — refunds only ever happen on AMERICELL's own Stripe). On confirm it
 * POSTs the CellGods `order_id` to the admin proxy and `router.refresh()`es the
 * Server Component table so the freed order drops out of the list.
 */
export default function DeactivateButton({
  orderId,
  label,
}: {
  orderId: string;
  /** Human name for the dialog copy (model, falling back to the order id). */
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function deactivate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.ok) {
        toast.success("Order deactivated.");
        setOpen(false);
        router.refresh();
        return;
      }
      toast.error(data.error ?? "Couldn't deactivate.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 rounded-full text-destructive hover:bg-destructive/10"
      >
        <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
        Deactivate
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate order?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{label}</span> will
              be released on CellGods immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-sm text-amber-800"
          >
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              <span className="font-semibold">No refund is issued.</span>{" "}
              Credit is not returned — this action is final.
            </span>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={loading}
              onClick={deactivate}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <PowerOff className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "Deactivating…" : "Yes, deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
