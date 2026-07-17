"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  ListFilter,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";

import { RelativeTime } from "@/components/admin/relative-time";
import LottiePlayer from "@/components/ui/lottie";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Type-only import from the `server-only` `lib/admin-data` — erased at build,
// so the DB-touching module is never pulled into the client bundle.
import type { AdminRentalRow } from "@/lib/admin-data";

/**
 * Admin RENTALS table (RESELLER_PLAN §6.2) — owner-only, presentational.
 *
 * A wide, edge-to-edge frosted-glass shadcn Table over the local `rentals` book:
 * each row pairs the RETAIL price the customer paid with the WHOLESALE amount
 * CellGods actually charged and the derived MARGIN (green). Wholesale/margin are
 * `null` until activation succeeds, so those cells degrade to a muted dash rather
 * than showing a bogus zero.
 *
 * All logic is client-side over the already-fetched rows (no data fetching, no
 * mutations here): full-text search, status + billing-period Selects, click-to-
 * sort headers, a live-count indicator, a router refresh, relative timestamps
 * (shared `RelativeTime`, native title → exact date), and a totals footer
 * (Σ retail / Σ wholesale / Σ margin) over the currently-visible rows.
 *
 * Dates render through the shared, hydration-safe `RelativeTime` (a single
 * ticking clock via `useSyncExternalStore`) so SSR and the first client render
 * are byte-identical — no `Date.now()` drift.
 */

/** Rental billing period → label. */
const PERIOD_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** Preferred display order for billing periods. */
const PERIOD_ORDER = ["daily", "weekly", "monthly"] as const;

/** Device platform → display label. */
const PLATFORM_LABEL: Record<string, string> = {
  iphone: "iPhone",
  android: "Android",
};

/** Preferred display order for statuses in the filter. */
const STATUS_ORDER = [
  "active",
  "pooled",
  "paid",
  "activating",
  "activation_pending_credit",
  "pending_payment",
  "deactivated",
  "expired",
  "cancelled",
  "canceled",
  "refunded",
] as const;

/** Statuses that count as a live device on the book (§5.4: `pooled` ≈ active). */
const LIVE_STATUSES = new Set(["active", "pooled"]);

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

/** Parse a nullable Date value defensively; invalid/absent → `null`. */
function toDate(value: Date | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** fmtMoney, but a nullable amount renders a muted em dash instead of "0". */
function money(cents: number | null): string {
  return cents == null ? "—" : fmtMoney(cents);
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

type SortKey =
  | "model"
  | "customerEmail"
  | "status"
  | "retailCents"
  | "chargedCents"
  | "marginCents"
  | "createdAt"
  | "expiresAt";
type SortDir = "asc" | "desc";

type Column = {
  label: string;
  align: "left" | "right";
  /** Omit to make the column non-sortable. */
  sortKey?: SortKey;
  className?: string;
};

const COLUMNS: readonly Column[] = [
  { label: "Device", align: "left", sortKey: "model" },
  { label: "Customer", align: "left", sortKey: "customerEmail" },
  { label: "Paid with", align: "left" },
  { label: "Status", align: "left", sortKey: "status" },
  { label: "Retail", align: "right", sortKey: "retailCents" },
  { label: "Wholesale", align: "right", sortKey: "chargedCents" },
  { label: "Margin", align: "right", sortKey: "marginCents" },
  { label: "Period", align: "left" },
  { label: "Started", align: "left", sortKey: "createdAt" },
  { label: "Expires", align: "left", sortKey: "expiresAt" },
];

/** Sortable value for a row+key; `null` sorts last regardless of direction. */
function sortValue(r: AdminRentalRow, key: SortKey): string | number | null {
  switch (key) {
    case "model":
      return r.model.toLowerCase();
    case "customerEmail":
      return r.customerEmail.toLowerCase();
    case "status":
      return r.status;
    case "retailCents":
      return r.retailCents;
    case "chargedCents":
      return r.chargedCents;
    case "marginCents":
      return r.marginCents;
    case "createdAt":
      return toDate(r.createdAt)?.getTime() ?? null;
    case "expiresAt":
      return toDate(r.expiresAt)?.getTime() ?? null;
  }
}

const ALL = "all";

export default function RentalsTable({
  rentals,
}: {
  rentals: AdminRentalRow[];
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [periodFilter, setPeriodFilter] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Distinct statuses / periods actually present, in a sensible order.
  const statusOptions = useMemo(() => {
    const present = new Set(rentals.map((r) => r.status));
    const ordered = STATUS_ORDER.filter((s) => present.has(s));
    const extras = [...present]
      .filter((s) => !STATUS_ORDER.includes(s as (typeof STATUS_ORDER)[number]))
      .sort();
    return [...ordered, ...extras];
  }, [rentals]);

  const periodOptions = useMemo(() => {
    const present = new Set(rentals.map((r) => r.billingPeriod));
    const ordered = PERIOD_ORDER.filter((p) => present.has(p));
    const extras = [...present]
      .filter((p) => !PERIOD_ORDER.includes(p as (typeof PERIOD_ORDER)[number]))
      .sort();
    return [...ordered, ...extras];
  }, [rentals]);

  const liveCount = useMemo(
    () => rentals.filter((r) => LIVE_STATUSES.has(r.status)).length,
    [rentals],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rentals.filter((r) => {
      if (statusFilter !== ALL && r.status !== statusFilter) return false;
      if (periodFilter !== ALL && r.billingPeriod !== periodFilter) return false;
      if (!q) return true;
      return (
        r.model.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q)
      );
    });

    const factor = sortDir === "asc" ? 1 : -1;
    // Copy before sorting so we never mutate the prop array in place.
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av === null && bv === null) return 0;
      if (av === null) return 1; // nulls always last
      if (bv === null) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv, "en") * factor;
      }
      return (Number(av) - Number(bv)) * factor;
    });
  }, [rentals, query, statusFilter, periodFilter, sortKey, sortDir]);

  // Totals over the currently-visible rows (respects search + filters).
  const totals = useMemo(() => {
    let retail = 0;
    let charged = 0;
    let margin = 0;
    let marginKnown = 0;
    for (const r of visible) {
      retail += r.retailCents;
      if (r.chargedCents != null) charged += r.chargedCents;
      if (r.marginCents != null) {
        margin += r.marginCents;
        marginKnown += 1;
      }
    }
    return { retail, charged, margin, marginKnown };
  }, [visible]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Sensible first click: text A→Z, numbers/dates high→recent first.
    setSortDir(key === "model" || key === "customerEmail" ? "asc" : "desc");
  }

  const filtersActive =
    query.trim() !== "" || statusFilter !== ALL || periodFilter !== ALL;

  function clearFilters() {
    setQuery("");
    setStatusFilter(ALL);
    setPeriodFilter(ALL);
  }

  // Whole-table empty state: no rentals exist at all. Lottie + copy.
  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <LottiePlayer
          src="/lottie/pulse.json"
          className="h-24 w-24 opacity-90"
        />
        <p className="text-base font-semibold text-foreground">No rentals yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Once a customer checks out and a device activates, every rental — with
          its retail price, the wholesale charge from CellGods, and the margin —
          shows up here.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
      <div>
        {/* Toolbar: search + status/period filters, live count + refresh. */}
        <div className="flex flex-col gap-3 border-b border-white/40 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search device or customer…"
                aria-label="Search rentals by device or customer"
                className="h-9 border-white/50 bg-white/50 pl-8 backdrop-blur-md dark:bg-white/10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter((value ?? ALL) as string)}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="h-9 gap-2 border-white/50 bg-white/50 backdrop-blur-md sm:w-44 dark:bg-white/10"
              >
                <ListFilter className="size-4 text-muted-foreground" />
                <SelectValue>
                  {(value: string | null) =>
                    !value || value === ALL
                      ? "All statuses"
                      : statusBadge(value).label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border border-white/50 bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80">
                <SelectItem value={ALL}>All statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusBadge(s).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodFilter}
              onValueChange={(value) => setPeriodFilter((value ?? ALL) as string)}
            >
              <SelectTrigger
                aria-label="Filter by billing period"
                className="h-9 gap-2 border-white/50 bg-white/50 backdrop-blur-md sm:w-40 dark:bg-white/10"
              >
                <CalendarClock className="size-4 text-muted-foreground" />
                <SelectValue>
                  {(value: string | null) =>
                    !value || value === ALL
                      ? "All periods"
                      : (PERIOD_LABEL[value] ?? value)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border border-white/50 bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80">
                <SelectItem value={ALL}>All periods</SelectItem>
                {periodOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABEL[p] ?? p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filtersActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
                Clear
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-white/50 bg-white/50 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-md dark:bg-white/10" />
                }
              >
                <LottiePlayer
                  src="/lottie/pulse.json"
                  className="h-4 w-4 shrink-0"
                />
                <span className="tabular-nums">{liveCount}</span>
                <span className="text-muted-foreground">live</span>
              </TooltipTrigger>
              <TooltipContent>
                {liveCount.toLocaleString("en-US")} device
                {liveCount === 1 ? "" : "s"} currently active or pooled
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5" />

            <p className="text-xs text-muted-foreground tabular-nums">
              {visible.length.toLocaleString("en-US")} of{" "}
              {rentals.length.toLocaleString("en-US")}
            </p>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startRefresh(() => router.refresh())}
                    disabled={isRefreshing}
                    className="h-9 border-white/50 bg-white/50 backdrop-blur-md dark:bg-white/10"
                  />
                }
              >
                <RefreshCw
                  className={cn("size-3.5", isRefreshing && "animate-spin")}
                />
                Refresh
              </TooltipTrigger>
              <TooltipContent>Re-read the live rentals book</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/40 hover:bg-transparent">
                {COLUMNS.map((col) => {
                  const active = col.sortKey && col.sortKey === sortKey;
                  const SortIcon = !active
                    ? ChevronsUpDown
                    : sortDir === "asc"
                      ? ChevronUp
                      : ChevronDown;
                  return (
                    <TableHead
                      key={col.label}
                      aria-sort={
                        active
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className={cn(
                        "text-muted-foreground",
                        col.align === "right" && "text-right",
                      )}
                    >
                      {col.sortKey ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.sortKey!)}
                          className={cn(
                            "group inline-flex items-center gap-1 rounded-md text-xs font-medium tracking-wide uppercase outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                            col.align === "right" && "flex-row-reverse",
                          )}
                        >
                          <span>{col.label}</span>
                          <SortIcon
                            className={cn(
                              "h-3.5 w-3.5 transition-opacity",
                              active
                                ? "text-brand opacity-90"
                                : "opacity-40 group-hover:opacity-70",
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <span className="text-xs font-medium tracking-wide uppercase">
                          {col.label}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {visible.length === 0 ? (
                // Filters/search matched nothing (distinct from no-rentals state).
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableCell colSpan={COLUMNS.length} className="py-14">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <LottiePlayer
                        src="/lottie/pulse.json"
                        className="h-16 w-16 opacity-80"
                      />
                      <p className="text-sm font-medium text-foreground">
                        No rentals match your filters
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-1 border-white/50 bg-white/50 backdrop-blur-md dark:bg-white/10"
                      >
                        <X className="size-3.5" />
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => {
                  const badge = statusBadge(r.status);
                  const platformLabel = PLATFORM_LABEL[r.platform] ?? r.platform;
                  const periodLabel =
                    PERIOD_LABEL[r.billingPeriod] ?? r.billingPeriod;
                  const marginPct =
                    r.marginCents != null && r.retailCents > 0
                      ? Math.round((r.marginCents / r.retailCents) * 100)
                      : null;
                  return (
                    <TableRow
                      key={r.id}
                      className="border-white/40 transition-colors hover:bg-white/30 dark:hover:bg-white/5"
                    >
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {r.model}
                        </span>
                        <span className="mt-1 flex items-center gap-1">
                          <Badge variant="outline" className="gap-1">
                            <Smartphone className="size-3" />
                            {platformLabel}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.customerEmail}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            r.paymentMethod === "Card" &&
                              "border-brand/20 bg-brand/10 text-brand",
                            r.paymentMethod === "NOWPayments" &&
                              "border-cyan-500/25 bg-cyan-500/10 text-cyan-600",
                            r.paymentMethod === "Unpaid" &&
                              "border-amber-500/25 bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {r.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {badge.label === r.status ? (
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger
                              render={<span className="cursor-default" />}
                            >
                              <Badge variant={badge.variant}>
                                {badge.label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-mono text-[11px]">
                                {r.status}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        )}
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
                      <TableCell className="text-right">
                        {r.marginCents == null ? (
                          <span className="tabular-nums text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <span className="inline-flex items-baseline justify-end gap-1.5">
                            <span className="font-semibold tabular-nums text-emerald-600">
                              {fmtMoney(r.marginCents)}
                            </span>
                            {marginPct != null ? (
                              <span className="text-[11px] tabular-nums text-emerald-600/70">
                                {marginPct}%
                              </span>
                            ) : null}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {periodLabel}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {r.createdAt ? (
                          <RelativeTime date={r.createdAt} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {r.expiresAt ? (
                          <RelativeTime date={r.expiresAt} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>

            {visible.length > 0 ? (
              <TableFooter className="border-t border-white/40 bg-white/40 dark:bg-white/5">
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableCell
                    colSpan={3}
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  >
                    Totals · {visible.length.toLocaleString("en-US")} rental
                    {visible.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-foreground">
                    {fmtMoney(totals.retail)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fmtMoney(totals.charged)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-emerald-600">
                    {fmtMoney(totals.margin)}
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className="text-right text-[11px] text-muted-foreground"
                  >
                    {totals.marginKnown.toLocaleString("en-US")} activated
                  </TableCell>
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
