"use client";

import { Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Type-only import from the `server-only` `lib/admin-data` — erased at build,
// so the DB-touching module is never pulled into the client bundle.
import type { AdminRentalRow } from "@/lib/admin-data";

/**
 * Admin RENTALS table (RESELLER_PLAN §6.2) — owner-only, presentational.
 *
 * A wide, horizontally-scrollable shadcn Table over the local `rentals` book:
 * each row pairs the RETAIL price the customer paid with the WHOLESALE amount
 * CellGods actually charged and the derived MARGIN. Wholesale/margin are `null`
 * until activation succeeds, so those cells degrade to a muted dash rather than
 * showing a bogus zero.
 *
 * Dates format with an EXPLICIT locale + timezone (en-US / America/New_York) so
 * the string is identical on the server and after client hydration — no
 * SSR↔CSR mismatch, no mount-gated effect needed.
 */

/** Rental billing period → label. */
const PERIOD_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** Device platform → display label. */
const PLATFORM_LABEL: Record<string, string> = {
  iphone: "iPhone",
  android: "Android",
};

/** Local rental status → Badge variant + label (RESELLER_PLAN §5.4). */
function statusBadge(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  switch (status) {
    case "active":
      return { variant: "default", label: "active" };
    case "pooled":
      return { variant: "secondary", label: "pooled" };
    case "paid":
      return { variant: "secondary", label: "paid" };
    case "activating":
      return { variant: "secondary", label: "activating…" };
    case "activation_pending_credit":
      return { variant: "outline", label: "credit pending" };
    case "pending_payment":
      return { variant: "outline", label: "payment pending" };
    case "deactivated":
      return { variant: "outline", label: "deactivated" };
    case "expired":
      return { variant: "outline", label: "expired" };
    case "cancelled":
    case "canceled":
      return { variant: "outline", label: "cancelled" };
    case "refunded":
      return { variant: "destructive", label: "refunded" };
    default:
      return { variant: "secondary", label: status };
  }
}

// Deterministic date formatting — fixed locale + timezone so server and client
// render byte-identical strings (see class-doc above).
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "America/New_York",
});

function fmtDate(value: Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : DATE_FMT.format(d);
}

/** fmtMoney, but a nullable amount renders a muted em dash instead of "0". */
function money(cents: number | null): string {
  return cents == null ? "—" : fmtMoney(cents);
}

export default function RentalsTable({
  rentals,
}: {
  rentals: AdminRentalRow[];
}) {
  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-muted-foreground backdrop-blur-md"
        >
          <Receipt className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          No rentals yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-white/40 hover:bg-transparent">
            <TableHead>Device</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Retail</TableHead>
            <TableHead className="text-right">Wholesale</TableHead>
            <TableHead className="text-right">Margin</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expires</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((r) => {
            const badge = statusBadge(r.status);
            const platformLabel = PLATFORM_LABEL[r.platform] ?? r.platform;
            const periodLabel = PERIOD_LABEL[r.billingPeriod] ?? r.billingPeriod;
            return (
              <TableRow key={r.id} className="border-white/40">
                <TableCell>
                  <span className="font-medium text-foreground">{r.model}</span>
                  <span className="mt-1 block">
                    <Badge variant="outline">{platformLabel}</Badge>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.customerEmail}
                </TableCell>
                <TableCell>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {fmtMoney(r.retailCents)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    r.chargedCents == null
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {money(r.chargedCents)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    r.marginCents == null
                      ? "font-normal text-muted-foreground"
                      : "text-emerald-600",
                  )}
                >
                  {money(r.marginCents)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {periodLabel}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {fmtDate(r.createdAt)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {fmtDate(r.expiresAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
