"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Search,
  Users,
} from "lucide-react";

// Type-only import from a `server-only` module — erased at build, never bundled.
import type { CustomerRow } from "@/lib/admin-data";
import { fmtMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
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
 * CustomersTable — owner-only customer book (RESELLER_PLAN §6).
 *
 * A presentational client component over `CustomerRow[]`: the parent Server
 * Component already aggregated each user's signup date, rentals count and total
 * spend. Adds client-side email search and click-to-sort column headers on top
 * — no data fetching, no mutations.
 *
 * Sort/search state defaults are fully deterministic (spend desc, empty query)
 * and dates are formatted with an EXPLICIT locale + timezone, so the SSR and
 * first client render produce identical markup (no hydration drift).
 */

type SortKey = "email" | "createdAt" | "rentalsCount" | "totalSpentCents";
type SortDir = "asc" | "desc";

type Column = {
  key: SortKey;
  label: string;
  align: "left" | "right";
};

const COLUMNS: readonly Column[] = [
  { key: "email", label: "Email", align: "left" },
  { key: "createdAt", label: "Signup", align: "left" },
  { key: "rentalsCount", label: "Rentals", align: "right" },
  { key: "totalSpentCents", label: "Total spend", align: "right" },
];

// Explicit locale + timezone → deterministic string on server and client.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "America/New_York",
});

function formatSignup(value: Date): string {
  // `createdAt` crosses the RSC boundary as a Date, but coerce defensively.
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : DATE_FMT.format(d);
}

/** Ascending comparator for a given column; direction is applied by the caller. */
function compareBy(a: CustomerRow, b: CustomerRow, key: SortKey): number {
  switch (key) {
    case "email":
      return a.email.localeCompare(b.email, "en");
    case "createdAt":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "rentalsCount":
      return a.rentalsCount - b.rentalsCount;
    case "totalSpentCents":
      return a.totalSpentCents - b.totalSpentCents;
  }
}

export default function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpentCents");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => r.email.toLowerCase().includes(q))
      : rows;
    // Copy before sorting so we never mutate the prop array in place.
    return [...filtered].sort((a, b) => {
      const cmp = compareBy(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Sensible first click: text A→Z, numbers/date high→recent first.
    setSortDir(key === "email" ? "asc" : "desc");
  }

  // Whole-table empty state: no customers exist at all.
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-muted-foreground backdrop-blur-md"
        >
          <Users className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          No customers yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar: email search + result count. */}
      <div className="flex flex-col gap-3 border-b border-white/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email…"
            aria-label="Search customers by email"
            className="h-9 border-white/50 bg-white/50 pl-8 backdrop-blur-md"
          />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {visible.length.toLocaleString("en-US")} of{" "}
          {rows.length.toLocaleString("en-US")} customers
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/40 hover:bg-transparent">
            {COLUMNS.map((col) => {
              const active = col.key === sortKey;
              const SortIcon = !active
                ? ChevronsUpDown
                : sortDir === "asc"
                  ? ChevronUp
                  : ChevronDown;
              return (
                <TableHead
                  key={col.key}
                  aria-sort={
                    active
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className={col.align === "right" ? "text-right" : undefined}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "group inline-flex items-center gap-1 rounded-md text-sm font-medium text-foreground outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            // Search matched nothing (distinct from the whole-table empty state).
            <TableRow className="border-white/40 hover:bg-transparent">
              <TableCell
                colSpan={COLUMNS.length}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No customers match &ldquo;{query.trim()}&rdquo;.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((c) => (
              <TableRow key={c.id} className="border-white/40">
                <TableCell className="font-medium text-foreground">
                  {c.email}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatSignup(c.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={c.rentalsCount > 0 ? "secondary" : "outline"}>
                    {c.rentalsCount.toLocaleString("en-US")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-foreground">
                  {fmtMoney(c.totalSpentCents)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
