"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  CreditCard,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LottiePlayer from "@/components/ui/lottie";
import { RelativeTime } from "@/components/admin/relative-time";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * OverviewActivity — the "Recent activity" feed on the admin overview.
 *
 * A presentational client feed over the newest audit-log rows the parent Server
 * Component fetched via `listLogs({ limit })`. Client-side only for the actor
 * filter, the free-text search, and the live relative timestamps. Action badges
 * are colour-coded by the action's namespace (admin / customer / rental / …).
 */

export type ActivityRow = {
  id: string;
  action: string;
  actorType: string;
  actorEmail: string | null;
  /** ISO creation timestamp. */
  createdAt: string;
  /** Pre-resolved amount (cents) for top-up rows, else null. */
  amountCents: number | null;
};

type ActorFilter = "all" | "admin" | "customer" | "system";

// Action → human label (naming convention from lib/logs.ts).
const ACTION_LABELS: Record<string, string> = {
  "customer.signup": "New customer signup",
  "customer.login": "Customer login",
  "checkout.started": "Checkout started",
  "rental.activated": "Rental activated",
  "rental.refunded": "Refund issued",
  "rental.pending_credit": "Credit pending",
  "rental.cancelled": "Rental cancelled",
  "admin.activate": "Activated by admin",
  "admin.deactivate": "Deactivated by admin",
  "admin.topup": "Credit top-up",
  "admin.auto_topup": "Automatic credit top-up",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** The token before the first "." — drives the badge colour. */
function actionPrefix(action: string): string {
  const dot = action.indexOf(".");
  return dot === -1 ? action : action.slice(0, dot);
}

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

/** Pick a leading glyph for a row from its action namespace. */
function logIcon(action: string): ReactNode {
  if (action.startsWith("admin.")) return <ShieldCheck />;
  if (action === "customer.signup" || action === "customer.login")
    return <UserRound />;
  if (action === "checkout.started") return <CreditCard />;
  if (action === "rental.refunded") return <RotateCcw />;
  if (action.startsWith("rental.")) return <Smartphone />;
  return <Activity />;
}

// Native <select> styled to match the shadcn Input (glass surface + focus ring).
const SELECT_CLASS =
  "h-9 cursor-pointer rounded-lg border border-input bg-white/60 px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function OverviewActivity({
  rows,
  currency,
}: {
  rows: ActivityRow[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState<ActorFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (actor !== "all" && r.actorType !== actor) return false;
      if (!q) return true;
      return (
        r.action.toLowerCase().includes(q) ||
        actionLabel(r.action).toLowerCase().includes(q) ||
        (r.actorEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, actor]);

  const hasFilters = query.trim() !== "" || actor !== "all";

  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/40 p-4">
        <div className="mr-auto flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Recent activity
          </h2>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </div>

        <div className="relative w-full sm:w-44">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity"
            aria-label="Search activity"
            className="h-9 w-full bg-white/60 pl-8"
          />
        </div>

        <select
          value={actor}
          onChange={(e) => setActor(e.target.value as ActorFilter)}
          aria-label="Filter by actor"
          className={cn(SELECT_CLASS, "flex-1 sm:flex-none")}
        >
          <option value="all">All actors</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="system">System</option>
        </select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => {
              setQuery("");
              setActor("all");
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
              ? "No activity yet."
              : "No activity matches these filters."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/40">
          {filtered.map((log) => (
            <li
              key={log.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand backdrop-blur-md [&_svg]:h-4 [&_svg]:w-4"
              >
                {logIcon(log.action)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">
                    {actionLabel(log.action)}
                  </p>
                  <Badge
                    className={cn(
                      "border-transparent",
                      prefixBadgeClass(log.action),
                    )}
                  >
                    {actionPrefix(log.action)}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {log.actorEmail ?? "system"}
                  {log.amountCents !== null
                    ? ` · ${fmtMoney(log.amountCents, currency)}`
                    : ""}
                </p>
              </div>
              <RelativeTime
                date={log.createdAt}
                className="ml-auto hidden text-xs text-muted-foreground sm:inline"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
