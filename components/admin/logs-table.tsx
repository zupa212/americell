"use client";

import { Fragment, useCallback, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Braces, ChevronDown, FileClock, Search, X } from "lucide-react";

import type { ActivityLog } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * LogsTable — owner-only activity-log viewer (RESELLER_PLAN audit trail).
 *
 * A presentational client component over `ActivityLog[]` that the parent Server
 * Component (`app/admin/logs/page.tsx`) already fetched + filtered. Client-side
 * only for: the URL-synced filter bar (`useRouter`/`useSearchParams`), the
 * per-row metadata disclosure, and the mount-gated relative time (which depends
 * on "now" and would otherwise drift between SSR and hydration).
 *
 * Columns: Time (relative + absolute), Action (color-coded Badge by the
 * action's prefix), Actor (email + actor type), Target (target type/id), and
 * an expandable Details cell that reveals the raw metadata JSON.
 */

// ── Time formatting ────────────────────────────────────────────────────────
// Absolute label uses an EXPLICIT locale + timezone so the server-rendered
// string and the hydrated one are byte-identical (no hydration mismatch).
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
  "admin.activate": "Activate",
  "admin.deactivate": "Deactivate",
  "admin.topup": "Credit top-up",
  "admin.auto_topup": "Auto top-up",
};

const ACTOR_LABELS: Record<string, string> = {
  admin: "Admin",
  customer: "Customer",
  system: "System",
};

const TARGET_LABELS: Record<string, string> = {
  rental: "Rental",
  order: "Order",
  phone: "Device",
  user: "User",
  subscription: "Subscription",
};

/** The token before the first "." — drives the Badge color. */
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
};

function prefixBadgeClass(action: string): string {
  return PREFIX_BADGE[actionPrefix(action)] ?? "bg-muted text-muted-foreground";
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
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

// Native <select> styled to match the shadcn Input (glass surface + focus ring).
const SELECT_CLASS =
  "h-9 cursor-pointer rounded-lg border border-input bg-white/60 px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

// ── Shared 60s clock ───────────────────────────────────────────────────────
// A single ticking store shared by every TimeCell (one interval, not one per
// row). `getSnapshot` returns a stable timestamp so `useSyncExternalStore` never
// loops; `getServerSnapshot` returns null → the server AND the first client
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

// ── Time cell (relative + absolute) ────────────────────────────────────────
function TimeCell({ date }: { date: Date }) {
  const now = useNow();
  const absolute = ABS_FMT.format(date);

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-foreground">
        {now ? relativeTime(date, now) : absolute}
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {absolute}
      </span>
    </div>
  );
}

// ── Filter bar (URL-synced) ────────────────────────────────────────────────
function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentActorType = searchParams.get("actorType") ?? "";
  const currentAction = searchParams.get("action") ?? "";

  const [actionDraft, setActionDraft] = useState(currentAction);
  const [syncedAction, setSyncedAction] = useState(currentAction);

  // Re-sync the free-text draft when the URL changes underneath us (back/forward
  // navigation, or the Clear button wiping the params). Adjusting state during
  // render — React's documented pattern for "reset state on a prop change" —
  // avoids an effect + its extra commit.
  if (currentAction !== syncedAction) {
    setSyncedAction(currentAction);
    setActionDraft(currentAction);
  }

  const pushParams = useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const hasFilters = Boolean(currentActorType || currentAction);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        pushParams({ action: actionDraft.trim() });
      }}
      className="flex flex-wrap items-end gap-3 border-b border-white/40 p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="log-actor"
          className="text-xs font-medium text-muted-foreground"
        >
          Actor
        </label>
        <select
          id="log-actor"
          value={currentActorType}
          onChange={(event) => pushParams({ actorType: event.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="log-action"
          className="text-xs font-medium text-muted-foreground"
        >
          Action
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="log-action"
            list="log-action-options"
            value={actionDraft}
            onChange={(event) => setActionDraft(event.target.value)}
            placeholder="e.g. admin.topup"
            className="h-9 w-56 bg-white/60"
          />
          <datalist id="log-action-options">
            {KNOWN_ACTIONS.map((action) => (
              <option key={action} value={action} />
            ))}
          </datalist>
          <Button
            type="submit"
            variant="outline"
            size="icon-lg"
            aria-label="Search"
            className="border-white/50 bg-white/60 backdrop-blur-md"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(pathname)}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </form>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────
export default function LogsTable({ logs }: { logs: ActivityLog[] }) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div>
      <FilterBar />

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-muted-foreground backdrop-blur-md"
          >
            <FileClock className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            No logs found for the selected filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/40 hover:bg-transparent">
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const expanded = openIds.has(log.id);
                const showMeta = hasMetadata(log.metadata);
                const hasTarget = Boolean(log.targetType || log.targetId);

                return (
                  <Fragment key={log.id}>
                    <TableRow className="border-white/40 align-top">
                      <TableCell>
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
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">
                            {log.actorEmail ?? "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {ACTOR_LABELS[log.actorType] ?? log.actorType}
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
                              <span className="font-mono text-[11px] break-all text-muted-foreground">
                                {log.targetId}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {showMeta ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-expanded={expanded}
                            onClick={() => toggle(log.id)}
                            className="ml-auto text-muted-foreground hover:text-foreground"
                          >
                            <Braces className="h-3.5 w-3.5" aria-hidden="true" />
                            {expanded ? "Hide" : "JSON"}
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {expanded && showMeta ? (
                      <TableRow className="border-white/40 hover:bg-transparent">
                        <TableCell colSpan={5} className="bg-white/40 p-0">
                          <div className="max-w-full overflow-x-auto p-4">
                            <pre className="font-mono text-xs leading-relaxed whitespace-pre text-foreground/80">
                              {formatJson(log.metadata)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
