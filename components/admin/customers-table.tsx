"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  Eye,
  ListFilter,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  Search,
  Wallet,
  X,
} from "lucide-react";

// Type-only import from a `server-only` module — erased at build, never bundled.
import type { CustomerRow } from "@/lib/admin-data";
import { fmtMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EmptyState } from "@/components/admin/empty-state";
import { RelativeTime } from "@/components/admin/relative-time";
import { cn } from "@/lib/utils";

/**
 * CustomersTable — owner-only customer book (RESELLER_PLAN §6).
 *
 * A presentational client component over `CustomerRow[]`: the parent Server
 * Component already aggregated each user's signup date, rentals count and total
 * spend. This layer adds client-side email search, a segment filter, click-to-
 * sort headers (default: spend desc), per-row quick actions and a read-only
 * detail dialog — all local UI, no data fetching, no mutations. The "Refresh"
 * control just re-runs the (force-dynamic) parent RSC via `router.refresh()`.
 *
 * Determinism: sort/search/segment defaults are fixed, dates render through the
 * hydration-safe {@link RelativeTime} (absolute label on SSR + first paint), and
 * avatar gradients derive from a pure hash — so SSR and the first client render
 * produce identical markup (no hydration drift).
 */

type SortKey = "email" | "createdAt" | "rentalsCount" | "totalSpentCents";
type SortDir = "asc" | "desc";
type Segment = "all" | "paying" | "rentals" | "dormant";
type Tier = "paying" | "pending" | "new";

const SEGMENT_LABELS: Record<Segment, string> = {
  all: "All customers",
  paying: "Paying",
  rentals: "With rentals",
  dormant: "No rentals",
};

const SEGMENT_ORDER: readonly Segment[] = ["all", "paying", "rentals", "dormant"];

const TIER_BADGE: Record<
  Tier,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  paying: { label: "Paying", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  new: { label: "New", variant: "outline" },
};

type Column = {
  key: SortKey;
  label: string;
  align: "left" | "right";
  className?: string;
};

const COLUMNS: readonly Column[] = [
  { key: "email", label: "Customer", align: "left" },
  { key: "createdAt", label: "Signup", align: "left" },
  { key: "rentalsCount", label: "Rentals", align: "right" },
  { key: "totalSpentCents", label: "Total spend", align: "right" },
];

/** Which bucket a customer falls into (paying ⊂ rentals). */
function tierOf(r: CustomerRow): Tier {
  if (r.totalSpentCents > 0) return "paying";
  if (r.rentalsCount > 0) return "pending";
  return "new";
}

/** Does a row belong to the selected segment? */
function inSegment(r: CustomerRow, segment: Segment): boolean {
  switch (segment) {
    case "paying":
      return r.totalSpentCents > 0;
    case "rentals":
      return r.rentalsCount > 0;
    case "dormant":
      return r.rentalsCount === 0;
    case "all":
    default:
      return true;
  }
}

/** Ascending comparator for a column; direction is applied by the caller. */
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

/** First two characters of the email → avatar initials. */
function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

/**
 * Pure hash → a hue constrained to the brand's blue→violet arc (210–280), so
 * each avatar is distinct yet on-palette. Deterministic → hydration-safe.
 */
function avatarStyle(email: string): React.CSSProperties {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  const hue = 210 + (hash % 70);
  return {
    backgroundImage: `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${
      (hue + 34) % 360
    } 80% 56%))`,
  };
}

const num = (n: number) => n.toLocaleString("en-US");

function Avatar({ email, className }: { email: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={avatarStyle(email)}
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-xs font-semibold text-white ring-1 ring-white/50",
        className,
      )}
    >
      {initials(email)}
    </span>
  );
}

export default function CustomersTable({
  rows,
  generatedAt,
}: {
  rows: CustomerRow[];
  /** ISO timestamp of the parent server render — powers the "updated" tooltip. */
  generatedAt?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpentCents");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Detail dialog + copy-feedback state.
  const [detail, setDetail] = useState<CustomerRow | null>(null);
  const [copied, setCopied] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter(
      (r) =>
        inSegment(r, segment) &&
        (q === "" || r.email.toLowerCase().includes(q)),
    );
    // Copy before sorting so we never mutate the prop array in place.
    return [...filtered].sort((a, b) => {
      const cmp = compareBy(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, segment, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Sensible first click: text A→Z, numbers/date high→recent first.
    setSortDir(key === "email" ? "asc" : "desc");
  }

  function resetFilters() {
    setQuery("");
    setSegment("all");
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard?.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  }

  // Whole-table empty state (defensive — the page renders <EmptyState/> before
  // mounting this when there are truly zero customers).
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No customers yet"
        description="Accounts appear here as people sign up and rent devices."
      />
    );
  }

  return (
    <TooltipProvider>
      {/* ── Toolbar: search · segment · refresh · count ─────────────────── */}
      <div className="flex flex-col gap-3 border-b border-white/40 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
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
              className="h-9 rounded-xl border-white/50 bg-white/60 pr-8 pl-8 ring-1 ring-white/40 backdrop-blur-md focus-visible:bg-white/75"
            />
            {query !== "" ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Select
            value={segment}
            onValueChange={(value) => setSegment((value ?? "all") as Segment)}
          >
            <SelectTrigger
              size="default"
              aria-label="Filter customers by segment"
              className="h-9 gap-2 rounded-xl border-white/50 bg-white/60 ring-1 ring-white/40 backdrop-blur-md hover:bg-white/75"
            >
              <ListFilter className="h-4 w-4 text-brand" aria-hidden="true" />
              <SelectValue>
                {(value: string | null) =>
                  SEGMENT_LABELS[(value as Segment) ?? "all"]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {SEGMENT_ORDER.map((key) => (
                <SelectItem key={key} value={key}>
                  {SEGMENT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p
            className="text-xs text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            <span className="font-medium text-foreground">
              {num(visible.length)}
            </span>{" "}
            of {num(rows.length)} customers
          </p>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startTransition(() => router.refresh())}
                  disabled={pending}
                  aria-label="Refresh customers"
                  className="gap-1.5 rounded-xl border-white/50 bg-white/60 ring-1 ring-white/40 backdrop-blur-md hover:bg-white/75"
                />
              }
            >
              <RotateCcw
                className={cn("h-3.5 w-3.5", pending && "animate-spin")}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {pending ? "Refreshing…" : "Refresh"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {generatedAt ? (
                <>
                  Updated <RelativeTime date={generatedAt} />
                </>
              ) : (
                "Reload the customer book"
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Table (or a compact no-match state) ─────────────────────────── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/50 bg-white/60 text-muted-foreground ring-1 ring-white/40 backdrop-blur-md"
          >
            <Search className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No customers match your filters
            </p>
            <p className="text-xs text-muted-foreground">
              {query.trim() !== "" ? (
                <>
                  No results for &ldquo;{query.trim()}&rdquo;
                  {segment !== "all"
                    ? ` in ${SEGMENT_LABELS[segment]}`
                    : ""}
                  .
                </>
              ) : (
                <>No customers in {SEGMENT_LABELS[segment]}.</>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="rounded-xl border-white/50 bg-white/60 backdrop-blur-md hover:bg-white/75"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-x-auto transition-opacity",
            pending && "pointer-events-none opacity-60",
          )}
        >
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
                      className={cn(
                        "px-4",
                        col.align === "right" && "text-right",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "group inline-flex items-center gap-1 rounded-md text-xs font-semibold tracking-wide text-muted-foreground uppercase outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
                <TableHead className="px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((c) => {
                const tier = TIER_BADGE[tierOf(c)];
                return (
                  <TableRow
                    key={c.id}
                    className="border-white/40 transition-colors hover:bg-white/40"
                  >
                    <TableCell className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetail(c)}
                        className="group flex items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                      >
                        <Avatar email={c.email} className="h-8 w-8" />
                        <span className="truncate font-medium text-foreground transition-colors group-hover:text-brand">
                          {c.email}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      <RelativeTime date={c.createdAt} />
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Badge
                        variant={c.rentalsCount > 0 ? "secondary" : "outline"}
                        className="tabular-nums"
                      >
                        {num(c.rentalsCount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-right font-semibold tabular-nums text-foreground">
                      {fmtMoney(c.totalSpentCents)}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant={tier.variant}>{tier.label}</Badge>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${c.email}`}
                              className="rounded-lg text-muted-foreground hover:bg-white/70 hover:text-foreground"
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/50 bg-white/80 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90 dark:ring-white/10"
                        >
                          <DropdownMenuLabel className="truncate">
                            {c.email}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/50" />
                          <DropdownMenuItem onClick={() => setDetail(c)}>
                            <Eye aria-hidden="true" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void copyEmail(c.email)}>
                            <Copy aria-hidden="true" />
                            Copy email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Read-only customer detail dialog ────────────────────────────── */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setCopied(false);
          }
        }}
      >
        {detail ? (
          <DialogContent className="sm:max-w-md border-white/50 bg-white/80 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90 dark:ring-white/10">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar email={detail.email} className="h-11 w-11 text-sm" />
                <div className="min-w-0">
                  <DialogTitle className="truncate">{detail.email}</DialogTitle>
                  <DialogDescription>
                    Customer since <RelativeTime date={detail.createdAt} />
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <DetailTile
                label="Total spend"
                value={fmtMoney(detail.totalSpentCents)}
                icon={<Wallet className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <DetailTile
                label="Rentals"
                value={num(detail.rentalsCount)}
                icon={<Receipt className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <DetailTile
                label="Status"
                value={
                  <Badge variant={TIER_BADGE[tierOf(detail)].variant}>
                    {TIER_BADGE[tierOf(detail)].label}
                  </Badge>
                }
              />
              <DetailTile
                label="Signup"
                value={
                  <span className="text-sm font-medium text-foreground">
                    <RelativeTime date={detail.createdAt} />
                  </span>
                }
              />
            </div>

            <DialogFooter className="border-white/40 bg-white/40">
              <Button
                variant="secondary"
                onClick={() => void copyEmail(detail.email)}
                className="gap-1.5"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy email"}
              </Button>
              <DialogClose
                render={
                  <Button
                    variant="outline"
                    className="border-white/50 bg-white/60 backdrop-blur-md hover:bg-white/75"
                  />
                }
              >
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </TooltipProvider>
  );
}

/** Small frosted stat tile used inside the detail dialog. */
function DetailTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/50 bg-white/50 p-3 ring-1 ring-white/40 backdrop-blur-md">
      <p className="flex items-center gap-1.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </p>
      <div className="mt-1.5 text-lg font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}
