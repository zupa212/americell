"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Hash,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import type { LedgerEntry } from "@/lib/cellgods";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LottiePlayer from "@/components/ui/lottie";
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

/**
 * Admin credit ledger (RESELLER_PLAN §6.2/§6.4) — a glass shadcn Table of
 * `LedgerEntry` rows: relative date, reason chip, signed delta (+green / −red),
 * and the running balance snapshot. Enriched with a client-side toolbar (free-text
 * search, type + direction filters, sortable columns, and a `router.refresh()`
 * action) plus a totals footer, all computed in the browser over the entries the
 * server already fetched. Client component so dates format in the viewer's
 * locale and the relative labels stay live.
 *
 * `LedgerEntry` is a type-only import — erased at build, so the `server-only`
 * `lib/cellgods` module never reaches this client bundle.
 */

// ── Reason vocabulary ────────────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  topup: "Top-up",
  top_up: "Top-up",
  auto_topup: "Auto top-up",
  activation: "Activation",
  activate: "Activation",
  refund: "Refund",
  adjustment: "Adjustment",
  deactivation: "Deactivation",
};

// Collapse the API's synonyms onto a single canonical key so the type filter
// matches regardless of which spelling CellGods returns.
const REASON_CANON: Record<string, string> = {
  topup: "topup",
  top_up: "topup",
  auto_topup: "auto_topup",
  activation: "activation",
  activate: "activation",
  refund: "refund",
  adjustment: "adjustment",
  deactivation: "deactivation",
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason.toLowerCase()] ?? reason;
}

function canonReason(reason: string): string {
  return REASON_CANON[reason.toLowerCase()] ?? "other";
}

type TypeFilter =
  | "all"
  | "topup"
  | "auto_topup"
  | "activation"
  | "refund"
  | "adjustment"
  | "deactivation";

const TYPE_ITEMS: Record<TypeFilter, string> = {
  all: "All types",
  topup: "Top-up",
  auto_topup: "Auto top-up",
  activation: "Activation",
  refund: "Refund",
  adjustment: "Adjustment",
  deactivation: "Deactivation",
};

type DirFilter = "all" | "credit" | "debit";

const DIR_ITEMS: Record<DirFilter, string> = {
  all: "All movements",
  credit: "Credits only",
  debit: "Debits only",
};

type SortKey = "date" | "change";
type SortDir = "asc" | "desc";

// ── Deterministic date formatting (no SSR↔CSR hydration mismatch) ─────────────
const ABS_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

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

function relativeTime(from: Date, now: Date): string {
  let duration = (from.getTime() - now.getTime()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return REL_FMT.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return REL_FMT.format(Math.round(duration), "year");
}

// ── Shared 60s clock (one interval for the whole table) ──────────────────────
// getServerSnapshot returns null so the server AND first client render both emit
// the deterministic absolute label; React swaps in relative labels post-hydration.
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

// ── Cells ────────────────────────────────────────────────────────────────────
function DateCell({ iso }: { iso: string }) {
  const now = useNow();
  const date = new Date(iso);
  const valid = !Number.isNaN(date.getTime());
  const absolute = valid ? ABS_FMT.format(date) : iso;
  const relative = valid && now ? relativeTime(date, now) : absolute;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex cursor-default flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              {relative}
            </span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {absolute}
            </span>
          </div>
        }
      />
      <TooltipContent>{absolute} · America/New_York</TooltipContent>
    </Tooltip>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground",
        active && "text-foreground",
        align === "right" && "flex-row-reverse",
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        )
      ) : (
        <ArrowDownUp className="size-3 opacity-40" aria-hidden="true" />
      )}
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  title,
  hint,
  onClear,
}: {
  title: string;
  hint: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <LottiePlayer src="/lottie/pulse.json" className="h-24 w-24" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────
export default function LedgerTable({
  entries,
  currency = "usd",
}: {
  entries: LedgerEntry[];
  currency?: string;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [dir, setDir] = useState<DirFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      // New column: sensible default (newest / largest first).
      setSortDir("desc");
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = entries.filter((e) => {
      if (dir === "credit" && e.delta_cents < 0) return false;
      if (dir === "debit" && e.delta_cents >= 0) return false;
      if (type !== "all" && canonReason(e.reason) !== type) return false;
      if (q) {
        const haystack = `${reasonLabel(e.reason)} ${e.reason} ${
          e.order_id ?? ""
        }`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...rows].sort((a, b) => {
      let cmp: number;
      if (sortKey === "change") {
        cmp = a.delta_cents - b.delta_cents;
      } else {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [entries, query, type, dir, sortKey, sortDir]);

  const totals = useMemo(() => {
    let credited = 0;
    let debited = 0;
    for (const e of filtered) {
      if (e.delta_cents >= 0) credited += e.delta_cents;
      else debited += e.delta_cents;
    }
    return { credited, debited, net: credited + debited };
  }, [filtered]);

  const hasFilters = query.trim() !== "" || type !== "all" || dir !== "all";
  const clearFilters = useCallback(() => {
    setQuery("");
    setType("all");
    setDir("all");
  }, []);

  return (
    <TooltipProvider delay={200}>
      <div>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/40 p-4">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reason or order ID…"
              aria-label="Search transactions"
              className="h-9 border-white/50 bg-white/60 pl-8 backdrop-blur-md dark:bg-input/30"
            />
          </div>

          <Select
            value={type}
            onValueChange={(v) => setType((v as TypeFilter | null) ?? "all")}
          >
            <SelectTrigger
              size="sm"
              aria-label="Filter by type"
              className="h-9 border-white/50 bg-white/60 backdrop-blur-md dark:bg-input/30"
            >
              <SelectValue>
                {(v: TypeFilter | null) => TYPE_ITEMS[v ?? "all"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-white/50 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90">
              {(Object.keys(TYPE_ITEMS) as TypeFilter[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {TYPE_ITEMS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dir}
            onValueChange={(v) => setDir((v as DirFilter | null) ?? "all")}
          >
            <SelectTrigger
              size="sm"
              aria-label="Filter by direction"
              className="h-9 border-white/50 bg-white/60 backdrop-blur-md dark:bg-input/30"
            >
              <SelectValue>
                {(v: DirFilter | null) => DIR_ITEMS[v ?? "all"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-white/50 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90">
              {(Object.keys(DIR_ITEMS) as DirFilter[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {DIR_ITEMS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              {filtered.length} of {entries.length}
            </span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X aria-hidden="true" />
                Clear
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startRefresh(() => router.refresh())}
                    disabled={refreshing}
                    aria-label="Refresh transactions"
                    className="border-white/50 bg-white/60 backdrop-blur-md dark:bg-input/30"
                  />
                }
              >
                <RefreshCw
                  className={cn("size-3.5", refreshing && "animate-spin")}
                  aria-hidden="true"
                />
                Refresh
              </TooltipTrigger>
              <TooltipContent>Re-read the balance from CellGods</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Body */}
        {entries.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            hint="Top-ups, activations, and refunds will appear here as they happen."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching transactions"
            hint="Try a different search term or loosen the filters."
            onClear={clearFilters}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/40 hover:bg-transparent">
                <TableHead className="px-4">
                  <SortHeader
                    label="Date"
                    active={sortKey === "date"}
                    dir={sortDir}
                    onClick={() => toggleSort("date")}
                  />
                </TableHead>
                <TableHead>
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Reason
                  </span>
                </TableHead>
                <TableHead className="px-4 text-right">
                  <SortHeader
                    label="Change"
                    active={sortKey === "change"}
                    dir={sortDir}
                    onClick={() => toggleSort("change")}
                    align="right"
                  />
                </TableHead>
                <TableHead className="px-4 text-right">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Balance
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((e, i) => {
                const positive = e.delta_cents >= 0;
                return (
                  <TableRow
                    key={`${e.created_at}-${e.order_id ?? "x"}-${i}`}
                    className="border-white/40 align-top hover:bg-white/40 dark:hover:bg-white/5"
                  >
                    <TableCell className="px-4">
                      <DateCell iso={e.created_at} />
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          className={cn(
                            "border-transparent",
                            positive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-300",
                          )}
                        >
                          {positive ? (
                            <ArrowUpRight aria-hidden="true" />
                          ) : (
                            <ArrowDownRight aria-hidden="true" />
                          )}
                          {reasonLabel(e.reason)}
                        </Badge>
                        {e.order_id && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="inline-flex max-w-[16rem] cursor-default items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                  <Hash
                                    className="size-3 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{e.order_id}</span>
                                </span>
                              }
                            />
                            <TooltipContent>
                              Order {e.order_id}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className={cn(
                        "px-4 text-right font-semibold tabular-nums",
                        positive ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {positive ? "+" : "−"}
                      {fmtMoney(Math.abs(e.delta_cents), currency)}
                    </TableCell>

                    <TableCell className="px-4 text-right tabular-nums text-foreground">
                      {fmtMoney(e.balance_after_cents, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            <TableFooter className="border-white/40 bg-white/40 dark:bg-white/5">
              <TableRow className="hover:bg-transparent">
                <TableCell className="px-4 text-xs text-muted-foreground">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "transaction" : "transactions"}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  Net
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 text-right font-semibold tabular-nums",
                    totals.net >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {totals.net >= 0 ? "+" : "−"}
                  {fmtMoney(Math.abs(totals.net), currency)}
                </TableCell>
                <TableCell className="px-4 text-right text-[11px] text-muted-foreground tabular-nums">
                  +{fmtMoney(totals.credited, currency)} /{" "}
                  −{fmtMoney(Math.abs(totals.debited), currency)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>
    </TooltipProvider>
  );
}
