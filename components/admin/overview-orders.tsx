"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Search, Smartphone, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LottiePlayer from "@/components/ui/lottie";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RelativeTime } from "@/components/admin/relative-time";
import { cn } from "@/lib/utils";

/**
 * OverviewOrders — the "Recent orders" panel on the admin overview.
 *
 * A presentational client table over the server-derived recent CellGods orders
 * (the parent Server Component joins each order to inventory and passes a lean,
 * serializable row down). Client-side only for the free-text search, the status
 * filter, and the expiry sort — no data fetching happens here.
 */

export type OverviewOrderRow = {
  orderId: string;
  model: string;
  customerEmail: string;
  status: string;
  /** ISO expiry timestamp. */
  expiresAt: string;
};

type StatusFilter = "all" | "active" | "expired" | "other";

type BadgeVariant = "default" | "secondary" | "outline";

// CellGods order statuses that count as a live rental (§5.4: `pooled` ≈ active).
const ACTIVE = new Set(["active", "pooled"]);

function statusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "active":
    case "pooled":
      return { label: "active", variant: "default" };
    case "expired":
      return { label: "expired", variant: "outline" };
    case "deactivated":
      return { label: "cancelled", variant: "outline" };
    default:
      return { label: status, variant: "secondary" };
  }
}

function statusGroup(status: string): StatusFilter {
  if (ACTIVE.has(status)) return "active";
  if (status === "expired") return "expired";
  return "other";
}

// Native <select> styled to match the shadcn Input (glass surface + focus ring).
const SELECT_CLASS =
  "h-9 cursor-pointer rounded-lg border border-input bg-white/60 px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function OverviewOrders({
  rows,
  total,
}: {
  rows: OverviewOrderRow[];
  /** Total orders in the CellGods book (for the count caption). */
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = rows.filter((r) => {
      if (status !== "all" && statusGroup(r.status) !== status) return false;
      if (!q) return true;
      return (
        r.model.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q)
      );
    });
    next.sort((a, b) => {
      const da = Date.parse(a.expiresAt);
      const db = Date.parse(b.expiresAt);
      return sortAsc ? da - db : db - da;
    });
    return next;
  }, [rows, query, status, sortAsc]);

  const hasFilters = query.trim() !== "" || status !== "all";

  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/40 p-4">
        <div className="mr-auto flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Recent orders</h2>
          <Badge
            variant="secondary"
            className="border border-white/50 bg-white/60 text-[0.7rem] text-muted-foreground backdrop-blur-md"
          >
            {total.toLocaleString("en-US")} total
          </Badge>
        </div>

        <div className="relative w-full sm:w-52">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search device or email"
            aria-label="Search recent orders"
            className="h-9 w-full bg-white/60 pl-8"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filter by status"
          className={cn(SELECT_CLASS, "flex-1 sm:flex-none")}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="other">Other</option>
        </select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
          <LottiePlayer src="/lottie/pulse.json" className="h-16 w-16" />
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "No orders yet."
              : "No orders match these filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/40 hover:bg-transparent">
                <TableHead>Device</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => setSortAsc((v) => !v)}
                    className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={`Sort by expiry (${sortAsc ? "soonest" : "latest"} first)`}
                  >
                    Expires
                    <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const badge = statusBadge(order.status);
                return (
                  <TableRow key={order.orderId} className="border-white/40">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-brand backdrop-blur-md [&_svg]:h-4 [&_svg]:w-4"
                        >
                          <Smartphone />
                        </span>
                        <span className="truncate font-medium text-foreground">
                          {order.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[16ch] truncate text-muted-foreground">
                      {order.customerEmail}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <RelativeTime date={order.expiresAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
