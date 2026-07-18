"use client";

import {
  Fragment,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import type { ComponentType } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Braces,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import type { ActivityLog } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LottiePlayer from "@/components/ui/lottie";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";

/**
 * LogsTable — owner-only activity-log viewer (RESELLER_PLAN audit trail).
 *
 * A glass shadcn Table over the `ActivityLog[]` the parent Server Component
 * (`app/admin/logs/page.tsx`) already fetched + filtered. Two layers of state:
 *
 *  - URL-synced server filters (`actorType`, `action`) via shadcn `Select` →
 *    `router.push` inside a `useTransition`, so the RSC re-fetches with a live
 *    pending affordance instead of a blocking navigation.
 *  - Local browser-only refinements — a free-text search box and a sortable
 *    Time column — computed over the rows already in hand.
 *
 * Columns: Time (live relative label + exact timestamp in a Tooltip), Action
 * (color-coded Badge by the action's prefix + the raw key), Actor (email + a
 * typed chip), Target (typed label + id), and a Details cell that opens the raw
 * metadata JSON in a frosted glass Popover. Empty and loading states are fully
 * designed, with a Lottie "No activity yet" hero when the log is genuinely empty.
 */

// ── Time formatting ────────────────────────────────────────────────────────
// Both labels use an EXPLICIT locale + timezone so the server-rendered string
// and the hydrated one are byte-identical (no hydration mismatch).
const ABS_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

const EXACT_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
  hour12: true,
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

/** Relative time between `from` and `now` (e.g. "5 minutes ago"). */
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

// ── Action / actor / target vocabularies ───────────────────────────────────
const KNOWN_ACTIONS: readonly string[] = [
  "customer.signup",
  "customer.login",
  "checkout.started",
  "rental.activated",
  "rental.refunded",
  "rental.pending_credit",
  "rental.cancelled",
  "device.control_opened",
  "device.stream_opened",
  "device.pin_revealed",
  "admin.activate",
  "admin.deactivate",
  "admin.topup",
  "admin.auto_topup",
];

const ACTION_LABELS: Record<string, string> = {
  "customer.signup": "Customer signup",
  "customer.login": "Customer login",
  "checkout.started": "Checkout started",
  "rental.activated": "Rental activated",
  "rental.refunded": "Refund issued",
  "rental.pending_credit": "Credit pending",
  "rental.cancelled": "Rental cancelled",
  "device.control_opened": "Remote control opened",
  "device.stream_opened": "Live stream opened",
  "device.pin_revealed": "PIN revealed",
  "admin.activate": "Activate",
  "admin.deactivate": "Deactivate",
  "admin.topup": "Credit top-up",
  "admin.auto_topup": "Auto top-up",
};

type ActorMeta = {
  label: string;
  badge: string;
  Icon: ComponentType<{ className?: string }>;
};

const ACTOR_META: Record<string, ActorMeta> = {
  admin: {
    label: "Admin",
    badge: "bg-violet-500/10 text-violet-600 ring-violet-500/20",
    Icon: ShieldCheck,
  },
  customer: {
    label: "Customer",
    badge: "bg-sky-500/10 text-sky-600 ring-sky-500/20",
    Icon: User,
  },
  system: {
    label: "System",
    badge: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
    Icon: Cpu,
  },
};

const TARGET_LABELS: Record<string, string> = {
  rental: "Rental",
  order: "Order",
  phone: "Device",
  user: "User",
  subscription: "Subscription",
};

/** The token before the first "." — drives the Action Badge color. */
function actionPrefix(action: string): string {
  const dot = action.indexOf(".");
  return dot === -1 ? action : action.slice(0, dot);
}

// Tailwind classes per action prefix (admin / customer / system + the domain
// prefixes we emit). Unknown prefixes fall back to a neutral muted chip.
const PREFIX_BADGE: Record<string, string> = {
  admin: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  customer: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  system: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  rental: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  checkout: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  device: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
};

// Solid dot color per prefix, for the action-select option markers.
const PREFIX_DOT: Record<string, string> = {
  admin: "bg-violet-500",
  customer: "bg-sky-500",
  system: "bg-slate-500",
  rental: "bg-emerald-500",
  checkout: "bg-amber-500",
  device: "bg-indigo-500",
};

function prefixBadgeClass(action: string): string {
  return PREFIX_BADGE[actionPrefix(action)] ?? "bg-muted text-muted-foreground";
}

function prefixDotClass(action: string): string {
  return PREFIX_DOT[actionPrefix(action)] ?? "bg-muted-foreground/50";
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function actorMeta(actorType: string): ActorMeta {
  return (
    ACTOR_META[actorType] ?? {
      label: actorType,
      badge: "bg-muted text-muted-foreground ring-foreground/10",
      Icon: User,
    }
  );
}

// ── Metadata helpers ───────────────────────────────────────────────────────
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when there is structured metadata worth expanding (non-empty). */
function hasMetadata(meta: unknown): boolean {
  if (meta == null) return false;
  if (typeof meta === "object") {
    return Object.keys(meta as Record<string, unknown>).length > 0;
  }
  return true;
}

function formatJson(meta: unknown): string {
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return String(meta);
  }
}

/** Flatten a plain-object metadata blob into printable [key, value] pairs. */
function metaEntries(meta: unknown): [string, string][] | null {
  if (!isPlainObject(meta)) return null;
  const entries = Object.entries(meta);
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => [
    key,
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value),
  ]);
}

// Glass overrides shared by the toolbar's shadcn inputs.
const GLASS_INPUT =
  "border-white/50 bg-white/60 backdrop-blur-md dark:bg-input/30";
const GLASS_POPUP = "border-white/50 bg-white/85 backdrop-blur-xl";

// ── Shared 60s clock ───────────────────────────────────────────────────────
// A single ticking store shared by every TimeCell (one interval, not one per
// row). `getServerSnapshot` returns null → the server AND the first client
// render both emit the deterministic absolute label (no hydration mismatch),
// then React swaps in the relative label after hydration.
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

// ── Time cell (relative + exact tooltip) ───────────────────────────────────
function TimeCell({ date }: { date: Date }) {
  const now = useNow();
  const absolute = ABS_FMT.format(date);
  const relative = now ? relativeTime(date, now) : absolute;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-help text-sm font-medium text-foreground underline decoration-foreground/20 decoration-dotted underline-offset-4" />
        }
      >
        {relative}
      </TooltipTrigger>
      <TooltipContent>{EXACT_FMT.format(date)}</TooltipContent>
    </Tooltip>
  );
}

// ── Metadata popover (glass) ───────────────────────────────────────────────
function MetadataPopover({ meta }: { meta: unknown }) {
  const json = useMemo(() => formatJson(meta), [meta]);
  const entries = useMemo(() => metaEntries(meta), [meta]);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(json)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }, [json]);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="View metadata"
            className={cn(
              "ml-auto text-muted-foreground hover:text-foreground",
              "border border-white/40 bg-white/40 backdrop-blur-md",
            )}
          />
        }
      >
        <Braces className="size-3.5" aria-hidden="true" />
        View
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-lg bg-brand/10 text-brand-2"
            >
              <Braces className="size-3.5" />
            </span>
            <PopoverTitle className="text-sm font-semibold text-foreground">
              Metadata
            </PopoverTitle>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={copy}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <Separator className="my-2.5 bg-white/50" />

        {entries ? (
          <dl className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-0.5">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[minmax(4.5rem,auto)_1fr] items-start gap-2 rounded-lg bg-white/50 px-2 py-1.5 ring-1 ring-white/40"
              >
                <dt className="font-mono text-[11px] break-all text-muted-foreground">
                  {key}
                </dt>
                <dd className="text-right font-mono text-[11px] break-all text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <pre className="max-h-64 overflow-auto rounded-lg bg-white/50 p-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-foreground/80 ring-1 ring-white/40">
            {json}
          </pre>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
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
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {hint}
        </p>
      </div>
      {onClear ? (
        <Button variant="outline" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

// ── Select option maps ─────────────────────────────────────────────────────
const ACTOR_ITEMS: Record<string, string> = {
  all: "All actors",
  admin: "Admin",
  customer: "Customer",
  system: "System",
};

type SortDir = "desc" | "asc";

// ── Table ──────────────────────────────────────────────────────────────────
export default function LogsTable({ logs }: { logs: ActivityLog[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentActorType = searchParams.get("actorType") ?? "all";
  const currentAction = searchParams.get("action") ?? "all";
  const hasUrlFilters = currentActorType !== "all" || currentAction !== "all";

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Action options: the known vocabulary ∪ whatever actually appears in the
  // fetched rows ∪ the currently-selected action (so the trigger always has a
  // label, even when its filter yields zero rows).
  const actionItems = useMemo<Record<string, string>>(() => {
    const values = new Set<string>(KNOWN_ACTIONS);
    for (const log of logs) values.add(log.action);
    if (currentAction !== "all") values.add(currentAction);
    const map: Record<string, string> = { all: "All actions" };
    for (const value of Array.from(values).sort()) {
      map[value] = actionLabel(value);
    }
    return map;
  }, [logs, currentAction]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    setQuery("");
    startTransition(() => router.push(pathname));
  }, [router, pathname]);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const toggleSort = useCallback(() => {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }, []);

  // Client-side refinement over the rows the server already handed us.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? logs.filter((log) => {
          const haystack = [
            log.action,
            log.actorEmail ?? "",
            log.actorType,
            log.targetType ?? "",
            log.targetId ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : logs;

    return [...filtered].sort((a, b) => {
      const cmp =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [logs, query, sortDir]);

  const hasAnyFilter = hasUrlFilters || query.trim() !== "";

  return (
    <TooltipProvider delay={200}>
      <div className="relative">
        {/* Slim indeterminate progress bar while an RSC filter/refresh is in flight. */}
        {pending ? (
          <Skeleton className="absolute inset-x-0 top-0 z-20 h-0.5 rounded-none bg-gradient-to-r from-brand via-brand-2 to-brand-soft" />
        ) : null}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/40 p-4">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search action, actor, or target…"
              aria-label="Search log entries"
              className={cn("h-9 pl-8", GLASS_INPUT)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-muted-foreground">
              Actor
            </span>
            <Select
              value={currentActorType}
              onValueChange={(value) => setParam("actorType", String(value))}
              items={ACTOR_ITEMS}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filter by actor type"
                className={cn("h-9 min-w-[9rem]", GLASS_INPUT)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={GLASS_POPUP}>
                {Object.entries(ACTOR_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-muted-foreground">
              Action
            </span>
            <Select
              value={currentAction}
              onValueChange={(value) => setParam("action", String(value))}
              items={actionItems}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filter by action"
                className={cn("h-9 min-w-[12rem]", GLASS_INPUT)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn("max-h-72", GLASS_POPUP)}>
                {Object.entries(actionItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {value === "all" ? (
                      label
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 rounded-full",
                            prefixDotClass(value),
                          )}
                        />
                        {label}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2 self-end">
            <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
              {rows.length} of {logs.length}
            </span>
            {hasAnyFilter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground"
              >
                <X aria-hidden="true" />
                Clear
              </Button>
            ) : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={pending}
                    aria-label="Refresh activity log"
                    className={GLASS_INPUT}
                  />
                }
              >
                <RefreshCw
                  className={cn("size-3.5", pending && "animate-spin")}
                  aria-hidden="true"
                />
                Refresh
              </TooltipTrigger>
              <TooltipContent>Re-read the latest activity</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Body */}
        {logs.length === 0 ? (
          hasUrlFilters ? (
            <EmptyState
              title="No logs match these filters"
              hint="No activity has been recorded for the selected actor and action. Try widening the filters."
              onClear={clearAll}
            />
          ) : (
            <EmptyState
              title="No activity yet"
              hint="Every admin, customer, and system action will stream in here as it happens."
            />
          )
        ) : rows.length === 0 ? (
          <EmptyState
            title="No logs match your search"
            hint="Try a different search term, or clear the filters to see everything again."
            onClear={clearAll}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead className="px-4">
                    <button
                      type="button"
                      onClick={toggleSort}
                      aria-label="Sort by time"
                      className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tracking-wide text-foreground uppercase transition-colors hover:text-brand-2"
                    >
                      Time
                      {sortDir === "asc" ? (
                        <ChevronUp className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Actor
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Target
                  </TableHead>
                  <TableHead className="px-4 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((log) => {
                  const showMeta = hasMetadata(log.metadata);
                  const hasTarget = Boolean(log.targetType || log.targetId);
                  const actor = actorMeta(log.actorType);

                  return (
                    <Fragment key={log.id}>
                      <TableRow className="border-white/40 align-top hover:bg-white/40 dark:hover:bg-white/5">
                        <TableCell className="px-4">
                          <TimeCell date={new Date(log.createdAt)} />
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              className={cn(
                                "border-transparent",
                                prefixBadgeClass(log.action),
                              )}
                            >
                              {actionLabel(log.action)}
                            </Badge>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {log.action}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm text-foreground">
                              {log.actorEmail ?? "—"}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                actor.badge,
                              )}
                            >
                              <actor.Icon className="size-3" aria-hidden="true" />
                              {actor.label}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {hasTarget ? (
                            <div className="flex flex-col">
                              {log.targetType ? (
                                <span className="text-sm text-foreground">
                                  {TARGET_LABELS[log.targetType] ??
                                    log.targetType}
                                </span>
                              ) : null}
                              {log.targetId ? (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <span className="max-w-[14rem] cursor-help truncate font-mono text-[11px] text-muted-foreground" />
                                    }
                                  >
                                    {log.targetId}
                                  </TooltipTrigger>
                                  <TooltipContent>{log.targetId}</TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="px-4 text-right">
                          {showMeta ? (
                            <MetadataPopover meta={log.metadata} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
