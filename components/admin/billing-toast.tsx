"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Fires a one-shot sonner toast when the billing page is loaded with
 * `?topup=success|cancel` — i.e. after returning from CellGods' hosted Stripe
 * Checkout (RESELLER_PLAN §6.4). Renders nothing; lives at the page top level
 * (outside the Tabs, whose panels unmount when hidden) so it always mounts.
 * Strips the query param afterwards so a refresh doesn't re-fire it.
 */
export default function BillingToast({
  status,
}: {
  status: "success" | "cancel" | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (!status || fired.current) return;
    fired.current = true;

    if (status === "success") {
      toast.success("Credit added — your balance is updated.");
    } else {
      toast.info("Top-up cancelled.");
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("topup");
    window.history.replaceState(null, "", url.toString());
  }, [status]);

  return null;
}
