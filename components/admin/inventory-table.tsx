"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Info,
  PackageOpen,
  RefreshCw,
  Search,
  Smartphone,
  Tag,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LottiePlayer from "@/components/ui/lottie";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
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
import ActivateDialog, {
  type ActivatePhone,
} from "@/components/admin/activate-dialog";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
// Type-only imports from a `server-only` module — erased at build, never bundled.
import type { BillingPeriod, Platform } from "@/lib/cellgods";

/** One inventory row projected for the admin table (RESELLER_PLAN §6.2). */
export type InventoryRow = {
  phoneId: string;
  model: string;
  platform: Platform; // CellGods `type`
  status: string;
  available: boolean;
  /** "pool" = pre-paid (no credit charge to activate) · "shared" = charged at activation. */
  source: string | null;
  assignable: boolean | null;
  currency: string;
  priceMonthlyCents: number | null; // wholesale
  retailMonthlyCents: number | null; // computed retail estimate (same math as checkout)
};

type DurationOption = {
  period: BillingPeriod;
  days: number;
  label: string;
};

type InventoryTableProps = {
  rows: InventoryRow[];
  durations: readonly DurationOption[];
  /** ISO timestamp of when the server read this snapshot — drives the live "updated ago" pill. */
  generatedAt: string;
};

type TypeFilter = "all" | Platform;
type SortKey = "model" | "priceMonthlyCents" | "retailMonthlyCents";
type SortDir = "asc" | "desc";

const PLATFORM_LABEL: Record<Platform, string> = {
  iphone: "iPhone",
  android: "Android",
};

const TYPE_FILTER_LABEL: Record<TypeFilter, string> = {
  all: "All types",
  iphone: "iPhone",
  android: "Android",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  rented: "In use",
  active: "In use",
  pooled: "Reserved",
  unavailable: "Unavailable",
};

const GLASS_CONTROL =
  "border-white/50 bg-white/50 ring-1 ring-white/30 backdrop-blur-md";

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

function money(cents: number | null, currency: string): string {
  return cents == null ? "—" : fmtMoney(cents, currency);
}

/** Human relative label; deterministic at ms=0 so SSR and first client render agree. */
function relativeAgo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Live "updated X ago" elapsed ms. `now` starts null so SSR and the first client
 * render both read 0 (→ "just now"), then a 1s interval ticks it — no impure
 * `Date.now()` during render and no synchronous setState in the effect body.
 */
function useElapsed(generatedAt: string): number {
  const base = useMemo(() => new Date(generatedAt).getTime(), [generatedAt]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [base]);
  if (now == null || Number.isNaN(base)) return 0;
  return Math.max(0, now - base);
}

/**
 * InventoryTable — admin live inventory (RESELLER_PLAN §6.2).
 *
 * Full-glass shadcn Table over `InventoryRow[]` with a client toolbar: model
 * SEARCH, type + status FILTER (shadcn Select), sortable price columns, a live
 * "updated ago" indicator, and a `router.refresh()` action. Wholesale
 * `price_monthly` and the retail estimate sit side by side; each `available`
 * phone gets an "Activate" action that opens {@link ActivateDialog}. All state
 * defaults are deterministic so SSR and the first client render match.
 */
export default function InventoryTable({
  rows,
  durations,
  generatedAt,
}: InventoryTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [target, setTarget] = useState<ActivatePhone | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("priceMonthlyCents");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const elapsed = useElapsed(generatedAt);

  const availableCount = useMemo(
    () => rows.filter((r) => r.available).length,
    [rows],
  );

  // Distinct statuses actually present → drives the status filter options.
  const statusValues = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) seen.add(r.status);
    return Array.from(seen).sort((a, b) =>
      statusLabel(a).localeCompare(statusLabel(b), "en"),
    );
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (q && !r.model.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && r.platform !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
    // Copy before sorting so the prop array is never mutated in place.
    return [...filtered].sort((a, b) => {
      let cmp: number;
      if (sortKey === "model") {
        cmp = a.model.localeCompare(b.model, "en");
      } else {
        cmp = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, typeFilter, statusFilter, sortKey, sortDir]);

  const filtersActive =
    query.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "model" ? "asc" : "asc");
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
  }

  function refresh() {
    startRefresh(() => router.refresh());
  }

  // Whole-table empty state: no devices at all → designed Lottie panel.
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <LottiePlayer
          src="/lottie/pulse.json"
          className="h-24 w-24 opacity-90"
        />
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">
            No inventory right now
          </p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            No devices are listed at the moment. Inventory changes constantly —
            refresh to check again.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className={cn(GLASS_CONTROL, "gap-2 hover:bg-white/70")}
        >
          <RefreshCw
            className={cn("size-4", isRefreshing && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-4 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search + filters */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search model…"
                aria-label="Search inventory by model"
                className={cn("h-9 pl-8", GLASS_CONTROL)}
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter((v as TypeFilter) ?? "all")}
            >
              <SelectTrigger
                aria-label="Filter by type"
                className={cn("h-9 min-w-[8.5rem] gap-2", GLASS_CONTROL)}
              >
                <Smartphone className="size-4 text-muted-foreground" aria-hidden />
                <SelectValue>
                  {(v) => TYPE_FILTER_LABEL[(v as TypeFilter) ?? "all"]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="iphone">iPhone</SelectItem>
                <SelectItem value="android">Android</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter((v as string) ?? "all")}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className={cn("h-9 min-w-[9.5rem] gap-2", GLASS_CONTROL)}
              >
                <Tag className="size-4 text-muted-foreground" aria-hidden />
                <SelectValue>
                  {(v) =>
                    (v as string) === "all" || v == null
                      ? "All statuses"
                      : statusLabel(v as string)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectItem value="all">All statuses</SelectItem>
                {statusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Live indicator + refresh */}
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground",
                GLASS_CONTROL,
              )}
            >
              <LottiePlayer
                src="/lottie/pulse.json"
                className="size-3.5"
              />
              <span className="tabular-nums">
                Updated {relativeAgo(elapsed)}
              </span>
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={isRefreshing}
                    className={cn(GLASS_CONTROL, "gap-2 hover:bg-white/70")}
                  />
                }
              >
                <RefreshCw
                  className={cn("size-4", isRefreshing && "animate-spin")}
                  aria-hidden
                />
                Refresh
              </TooltipTrigger>
              <TooltipContent>Re-read live inventory</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Counts */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="secondary"
            className="border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <span className="mr-1 inline-flex size-1.5 rounded-full bg-emerald-500" />
            {availableCount.toLocaleString("en-US")} available
          </Badge>
          <Separator orientation="vertical" className="h-4 bg-white/50" />
          <span className="tabular-nums">
            Showing {visible.length.toLocaleString("en-US")} of{" "}
            {rows.length.toLocaleString("en-US")} devices
          </span>
        </div>
      </div>

      <Separator className="bg-white/40" />

      <Table>
        <TableHeader>
          <TableRow className="border-white/40 hover:bg-transparent">
            <SortableHead
              label="Model"
              active={sortKey === "model"}
              dir={sortDir}
              onClick={() => toggleSort("model")}
            />
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <SortableHead
              label="Wholesale / mo"
              align="right"
              active={sortKey === "priceMonthlyCents"}
              dir={sortDir}
              onClick={() => toggleSort("priceMonthlyCents")}
            />
            <TableHead className="text-right">
              <span className="inline-flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => toggleSort("retailMonthlyCents")}
                  className={cn(
                    "group inline-flex flex-row-reverse items-center gap-1 rounded-md text-sm font-medium text-foreground transition-colors hover:text-brand",
                  )}
                >
                  <span>Retail (est.)</span>
                  <SortGlyph active={sortKey === "retailMonthlyCents"} dir={sortDir} />
                </button>
                <Tooltip>
                  <TooltipTrigger
                    render={<span className="cursor-help text-muted-foreground" />}
                  >
                    <Info className="size-3.5" aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent>
                    Estimated customer price — same markup as checkout.
                  </TooltipContent>
                </Tooltip>
              </span>
            </TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow className="border-white/40 hover:bg-transparent">
              <TableCell colSpan={7} className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl text-muted-foreground",
                      GLASS_CONTROL,
                    )}
                  >
                    <PackageOpen className="size-5" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    No devices match your filters.
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            visible.map((row) => (
              <TableRow key={row.phoneId} className="border-white/40">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {row.model}
                    </span>
                    <span className="font-mono text-[0.7rem] text-muted-foreground">
                      {row.phoneId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="border-transparent bg-brand-2/10 text-brand-2"
                  >
                    {PLATFORM_LABEL[row.platform] ?? row.platform}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex size-2 rounded-full",
                        row.available
                          ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        row.available
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  {row.source ? (
                    <span className="inline-flex flex-col items-start gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-fit font-medium",
                          row.source === "pool"
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-muted-foreground/20 bg-muted text-muted-foreground",
                        )}
                      >
                        {row.source === "pool" ? "Pool · pre-paid" : "Shared"}
                      </Badge>
                      {row.assignable === false && (
                        <span className="text-[0.7rem] font-medium text-amber-600 dark:text-amber-400">
                          not assignable
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">
                  {money(row.priceMonthlyCents, row.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {money(row.retailMonthlyCents, row.currency)}
                </TableCell>
                <TableCell className="text-right">
                  {row.available ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        setTarget({
                          phoneId: row.phoneId,
                          model: row.model,
                          currency: row.currency,
                        })
                      }
                      className="gap-1.5 bg-gradient-to-r from-brand to-brand-2 text-white shadow-sm hover:opacity-90"
                    >
                      <Zap className="size-3.5" aria-hidden />
                      Activate
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="cursor-default text-xs text-muted-foreground" />
                        }
                      >
                        —
                      </TooltipTrigger>
                      <TooltipContent>
                        Only available devices can be activated.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ActivateDialog
        key={target?.phoneId ?? "closed"}
        phone={target}
        durations={durations}
        onClose={() => setTarget(null)}
      />
    </TooltipProvider>
  );
}

/** Right-or-left aligned sortable column header (shared with the plain heads). */
function SortableHead({
  label,
  align = "left",
  active,
  dir,
  onClick,
}: {
  label: string;
  align?: "left" | "right";
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <TableHead
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={align === "right" ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group inline-flex items-center gap-1 rounded-md text-sm font-medium text-foreground transition-colors hover:text-brand",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span>{label}</span>
        <SortGlyph active={active} dir={dir} />
      </button>
    </TableHead>
  );
}

function SortGlyph({ active, dir }: { active: boolean; dir: SortDir }) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <Icon
      className={cn(
        "size-3.5 transition-opacity",
        active ? "text-brand opacity-90" : "opacity-40 group-hover:opacity-70",
      )}
      aria-hidden
    />
  );
}
