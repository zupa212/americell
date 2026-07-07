"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Mail,
  MoreHorizontal,
  PanelRightOpen,
  RefreshCw,
  Search,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DeactivateButton from "@/components/admin/deactivate-button";
import LottiePlayer from "@/components/ui/lottie";
import { cn } from "@/lib/utils";

/**
 * Owner-only orders table (RESELLER_PLAN §6.2, §6.4).
 *
 * A presentational-plus client component: the parent Server Component
 * (`app/admin/orders/page.tsx`) resolved `phone_id → model` from live inventory
 * and preformatted an absolute `expiresLabel` on the server; it also passes the
 * raw `expiresAt` ISO so we can render a LIVE relative countdown behind a
 * mount-gated shared clock (server + first client render both emit the
 * deterministic absolute label → no hydration drift, then the relative label
 * swaps in). All state here is client-only UI: search, status Tabs, sort Select,
 * an auto-refresh Switch, a details Sheet, and per-row copy actions. Only live
 * orders (`active`/`pooled`) expose the deactivate control.
 */

export type AdminOrderRow = {
  order_id: string;
  phone_id: string;
  model: string | null;
  customer_email: string;
  status: string;
  /** Raw ISO expiry (or null) — drives the client-side relative countdown. */
  expiresAt: string | null;
  /** Preformatted on the server (en-US / America/New_York); "—" when absent. */
  expiresLabel: string;
};

/** CellGods statuses that entitle a live order (§5.4: `pooled` ≈ active). */
const ACTIVE_STATUSES = new Set(["active", "pooled"]);
const DAY_MS = 86_400_000;

// ── Status grouping (Tabs) + badges ─────────────────────────────────────────
type StatusGroup = "live" | "pending" | "expired" | "ended";
type GroupKey = "all" | StatusGroup;

function statusGroup(status: string): StatusGroup {
  switch (status) {
    case "active":
    case "pooled":
      return "live";
    case "pending":
      return "pending";
    case "expired":
      return "expired";
    default:
      return "ended";
  }
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  pooled: {
    label: "Pooled",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  expired: {
    label: "Expired",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  deactivated: { label: "Deactivated", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
  canceled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

function statusMeta(status: string): { label: string; className: string } {
  return STATUS_META[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
}

// ── Sorting ─────────────────────────────────────────────────────────────────
type SortKey = "expiry-asc" | "expiry-desc" | "customer" | "status";

const SORT_ITEMS: Record<SortKey, string> = {
  "expiry-asc": "Expiry: soonest",
  "expiry-desc": "Expiry: latest",
  customer: "Customer A–Z",
  status: "Status",
};

const STATUS_RANK: Record<string, number> = {
  active: 0,
  pooled: 1,
  pending: 2,
  expired: 3,
  deactivated: 4,
  cancelled: 5,
  canceled: 5,
};

function expiryMs(row: AdminOrderRow): number | null {
  if (!row.expiresAt) return null;
  const t = new Date(row.expiresAt).getTime();
  return Number.isNaN(t) ? null : t;
}

// Deterministic comparator (uses only static ISO timestamps, never "now") so
// the initial sorted order is byte-identical on server and client.
function compareRows(a: AdminOrderRow, b: AdminOrderRow, sort: SortKey): number {
  switch (sort) {
    case "customer":
      return (
        a.customer_email.localeCompare(b.customer_email, "en") ||
        a.order_id.localeCompare(b.order_id)
      );
    case "status":
      return (
        (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) ||
        a.order_id.localeCompare(b.order_id)
      );
    case "expiry-asc":
    case "expiry-desc": {
      const ea = expiryMs(a);
      const eb = expiryMs(b);
      if (ea == null && eb == null) return a.order_id.localeCompare(b.order_id);
      if (ea == null) return 1; // no-expiry rows always sink to the bottom
      if (eb == null) return -1;
      return sort === "expiry-asc" ? ea - eb : eb - ea;
    }
  }
}

// ── Relative-time formatting ────────────────────────────────────────────────
const REL_FMT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: ReadonlyArray<{
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/** Signed relative time from `now` to `target` (e.g. "in 3 hours"/"2 days ago"). */
function relativeTime(target: Date, now: Date): string {
  let duration = (target.getTime() - now.getTime()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return REL_FMT.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return REL_FMT.format(Math.round(duration), "year");
}

// ── Shared 60s clock ────────────────────────────────────────────────────────
// One interval shared by every ExpiryCell. `getServerSnapshot` returns null so
// the server AND the first client render both emit the deterministic absolute
// label (no hydration mismatch); the relative label swaps in after hydration.
let clockNow = Date.now();
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (clockTimer === null) {
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const l of clockListeners) l();
    }, 60_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function useNow(): Date | null {
  const snapshot = useSyncExternalStore(
    subscribeClock,
    () => clockNow,
    () => null,
  );
  return snapshot === null ? null : new Date(snapshot);
}

// ── Expiry cell (relative + absolute tooltip) ───────────────────────────────
function ExpiryCell({ iso, label }: { iso: string | null; label: string }) {
  const now = useNow();

  if (!iso) return <span className="text-muted-foreground">—</span>;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return <span className="tabular-nums text-muted-foreground">{label}</span>;
  }

  // Before hydration: deterministic absolute string (matches the server).
  if (!now) {
    return <span className="tabular-nums text-muted-foreground">{label}</span>;
  }

  const delta = target.getTime() - now.getTime();
  const soon = delta > 0 && delta <= DAY_MS;
  const past = delta <= 0;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex cursor-default items-center gap-1.5 text-sm tabular-nums",
              past
                ? "text-muted-foreground"
                : soon
                  ? "font-medium text-amber-600 dark:text-amber-400"
                  : "text-foreground",
            )}
          >
            {soon ? (
              <span
                aria-hidden="true"
                className="inline-flex size-1.5 animate-pulse rounded-full bg-amber-500"
              />
            ) : null}
            {relativeTime(target, now)}
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// ── Row detail helpers ──────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-right text-sm text-foreground",
          mono && "font-mono text-xs break-all",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function RowMenu({
  row,
  onDetails,
}: {
  row: AdminOrderRow;
  onDetails: () => void;
}) {
  const copy = useCallback((text: string, what: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard unavailable.");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${what} copied.`))
      .catch(() => toast.error("Couldn't copy."));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Order actions"
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-white/50 bg-popover/95 backdrop-blur-xl"
      >
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onDetails}>
          <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copy(row.order_id, "Order ID")}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy order ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copy(row.customer_email, "Email")}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          Copy email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copy(row.phone_id, "Device ID")}>
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          Copy device ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Table ───────────────────────────────────────────────────────────────────
export default function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupKey>("all");
  const [sort, setSort] = useState<SortKey>("expiry-asc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [detail, setDetail] = useState<AdminOrderRow | null>(null);

  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  // Optional 30s polling — a client-only effect, so it never affects SSR.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      startRefresh(() => router.refresh());
    }, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, router]);

  const counts = useMemo(() => {
    const c = { all: orders.length, live: 0, pending: 0, expired: 0, ended: 0 };
    for (const o of orders) c[statusGroup(o.status)] += 1;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      if (group !== "all" && statusGroup(o.status) !== group) return false;
      if (!q) return true;
      return (
        o.order_id.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        (o.model ?? "").toLowerCase().includes(q) ||
        o.phone_id.toLowerCase().includes(q)
      );
    });
    // Copy before sort so we never mutate the prop array in place.
    return [...filtered].sort((a, b) => compareRows(a, b, sort));
  }, [orders, query, group, sort]);

  // Whole-table empty state: no orders exist at all.
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <LottiePlayer src="/lottie/pulse.json" className="h-24 w-24" />
        <p className="text-sm font-medium text-foreground">No orders right now</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Live rentals appear here the moment a customer activates a device on
          CellGods.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="mt-1 border-white/50 bg-white/60 backdrop-blur-md"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>
    );
  }

  const TABS: ReadonlyArray<{ key: GroupKey; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "live", label: "Live", count: counts.live },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "expired", label: "Expired", count: counts.expired },
    { key: "ended", label: "Ended", count: counts.ended },
  ];

  return (
    <TooltipProvider delay={200}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/40 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, email or device…"
              aria-label="Search orders"
              className="h-9 border-white/50 bg-white/60 pl-8 backdrop-blur-md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
              items={SORT_ITEMS}
            >
              <SelectTrigger
                aria-label="Sort orders"
                className="h-9 min-w-44 border-white/50 bg-white/60 backdrop-blur-md"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                {(Object.keys(SORT_ITEMS) as SortKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_ITEMS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/50 bg-white/60 px-3 text-xs font-medium text-muted-foreground backdrop-blur-md select-none">
              <Switch
                checked={autoRefresh}
                onCheckedChange={(v) => setAutoRefresh(v)}
                aria-label="Auto-refresh every 30 seconds"
              />
              Auto
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              className="h-9 border-white/50 bg-white/60 backdrop-blur-md"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Horizontal scroll on narrow screens so the 5 tabs never overflow the page. */}
          <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <Tabs value={group} onValueChange={(v) => setGroup(v as GroupKey)}>
              <TabsList className="border border-white/50 bg-white/50 backdrop-blur-md">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    {tab.label}
                    <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 text-[11px] tabular-nums text-muted-foreground">
                      {tab.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <p className="text-xs text-muted-foreground tabular-nums">
            {visible.length.toLocaleString("en-US")} of{" "}
            {orders.length.toLocaleString("en-US")} shown
          </p>
        </div>
      </div>

      {/* Table (with a soft refreshing overlay) */}
      <div className="relative">
        {isRefreshing ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/30">
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 py-1.5 pr-3 pl-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
              <LottiePlayer src="/lottie/loader.json" className="h-5 w-5" />
              Refreshing…
            </span>
          </div>
        ) : null}

        <Table
          className={cn(
            "transition-opacity",
            isRefreshing && "opacity-50",
          )}
        >
          <TableHeader>
            <TableRow className="border-white/40 hover:bg-transparent">
              <TableHead>Order</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="border-white/40 hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No orders match your filters
                  {query.trim() ? <> for &ldquo;{query.trim()}&rdquo;</> : null}.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((o) => {
                const meta = statusMeta(o.status);
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
                      <Badge className={cn("border-transparent", meta.className)}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ExpiryCell iso={o.expiresAt} label={o.expiresLabel} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canDeactivate ? (
                          <DeactivateButton
                            orderId={o.order_id}
                            label={deviceLabel}
                          />
                        ) : null}
                        <RowMenu row={o} onDetails={() => setDetail(o)} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Row-details Sheet */}
      <Sheet
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <SheetContent
          side="right"
          className="border-white/50 bg-white/70 backdrop-blur-xl"
        >
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>Order details</SheetTitle>
                <SheetDescription>
                  Live CellGods rental — read-only snapshot.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-4">
                <DetailRow label="Order ID" value={detail.order_id} mono />
                <Separator className="bg-white/50" />
                <DetailRow
                  label="Device"
                  value={detail.model ?? detail.phone_id}
                />
                <DetailRow label="Device ID" value={detail.phone_id} mono />
                <Separator className="bg-white/50" />
                <DetailRow label="Customer" value={detail.customer_email} />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Status
                  </span>
                  <Badge
                    className={cn(
                      "border-transparent",
                      statusMeta(detail.status).className,
                    )}
                  >
                    {statusMeta(detail.status).label}
                  </Badge>
                </div>
                <Separator className="bg-white/50" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Expires
                  </span>
                  <span className="text-sm">
                    <ExpiryCell
                      iso={detail.expiresAt}
                      label={detail.expiresLabel}
                    />
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {detail.expiresLabel}
                  </span>
                </div>
              </div>

              <SheetFooter>
                {ACTIVE_STATUSES.has(detail.status) ? (
                  <DeactivateButton
                    orderId={detail.order_id}
                    label={detail.model ?? detail.phone_id}
                    onDone={() => setDetail(null)}
                    className="w-full justify-center"
                  />
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    This order is no longer active.
                  </p>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
