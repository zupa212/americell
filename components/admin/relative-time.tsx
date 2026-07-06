"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/**
 * RelativeTime — a live, hydration-safe "5 minutes ago" / "in 3 days" label for
 * the admin overview (shared by the recent-orders table and the activity feed).
 *
 * A single ticking store (one 30s interval for the whole page, not one per row)
 * drives every instance. `getServerSnapshot` returns `null` so the server AND
 * the first client render both emit the deterministic ABSOLUTE label (explicit
 * en-US / America/New_York) — no SSR↔CSR mismatch — then React swaps in the
 * relative label after hydration and keeps it fresh.
 */

// Absolute label — EXPLICIT locale + timezone so server/client bytes match.
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

/** Signed relative time between `from` and `now` (past → "ago", future → "in"). */
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

// ── Shared 30s clock ────────────────────────────────────────────────────────
let clockNow = Date.now();
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (clockTimer === null) {
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const l of clockListeners) l();
    }, 30_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

/** Shared "now" — `null` on the server + first client render (deterministic SSR). */
export function useNow(): Date | null {
  const snapshot = useSyncExternalStore(
    subscribeClock,
    () => clockNow,
    () => null,
  );
  return snapshot === null ? null : new Date(snapshot);
}

export function RelativeTime({
  date,
  className,
}: {
  /** ISO string or Date; parsed once per render. */
  date: string | Date;
  className?: string;
}) {
  const value = typeof date === "string" ? new Date(date) : date;
  const now = useNow();
  const valid = !Number.isNaN(value.getTime());
  const absolute = valid ? ABS_FMT.format(value) : "—";

  return (
    <span className={cn("tabular-nums", className)} title={absolute}>
      {now && valid ? relativeTime(value, now) : absolute}
    </span>
  );
}

export default RelativeTime;
