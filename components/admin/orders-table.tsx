"use client";

import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeactivateButton from "@/components/admin/deactivate-button";

/**
 * Owner-only orders table (RESELLER_PLAN §6.2, §6.4).
 *
 * A dumb, presentational client component: the parent Server Component
 * (`app/admin/orders/page.tsx`) already resolved `phone_id → model` from live
 * inventory and preformatted `expiresLabel` on the server, so there is NO
 * date/locale formatting here (avoids server/client hydration drift). Only
 * live orders (`active`/`pooled`) expose a deactivate control; terminal orders
 * render a muted dash.
 */

export type AdminOrderRow = {
  order_id: string;
  phone_id: string;
  model: string | null;
  customer_email: string;
  status: string;
  /** Preformatted on the server (el-GR / Europe/Athens); "—" when absent. */
  expiresLabel: string;
};

/** CellGods statuses that entitle a live order (§5.4: `pooled` ≈ active). */
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/** CellGods order status → Badge variant + Greek label. */
function statusBadge(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  switch (status) {
    case "active":
      return { variant: "default", label: "ενεργή" };
    case "pooled":
      return { variant: "secondary", label: "σε pool" };
    case "expired":
      return { variant: "outline", label: "έληξε" };
    case "deactivated":
    case "cancelled":
    case "canceled":
      return { variant: "outline", label: "απενεργοποιημένη" };
    case "pending":
      return { variant: "secondary", label: "εκκρεμεί" };
    default:
      return { variant: "secondary", label: status };
  }
}

export default function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-muted-foreground backdrop-blur-md"
        >
          <Inbox className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          Δεν υπάρχουν παραγγελίες αυτή τη στιγμή.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/40 hover:bg-transparent">
          <TableHead>Παραγγελία</TableHead>
          <TableHead>Συσκευή</TableHead>
          <TableHead>Πελάτης</TableHead>
          <TableHead>Κατάσταση</TableHead>
          <TableHead>Λήγει</TableHead>
          <TableHead className="text-right">Ενέργειες</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => {
          const badge = statusBadge(o.status);
          const deviceLabel = o.model ?? o.phone_id;
          const canDeactivate = ACTIVE_STATUSES.has(o.status);
          return (
            <TableRow key={o.order_id} className="border-white/40">
              <TableCell className="font-mono text-xs text-muted-foreground">
                {o.order_id}
              </TableCell>
              <TableCell>
                <span className="font-medium text-foreground">
                  {deviceLabel}
                </span>
                {o.model ? (
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {o.phone_id}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {o.customer_email}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {o.expiresLabel}
              </TableCell>
              <TableCell className="text-right">
                {canDeactivate ? (
                  <div className="flex justify-end">
                    <DeactivateButton
                      orderId={o.order_id}
                      label={deviceLabel}
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
