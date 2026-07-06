"use client";

import type { LedgerEntry } from "@/lib/cellgods";
import { fmtMoney } from "@/lib/money";
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
 * Admin credit ledger (RESELLER_PLAN §6.2/§6.4) — a shadcn Table of
 * `LedgerEntry` rows: date, reason, signed delta (+green / −red), running
 * balance. Client component so dates format in the viewer's locale/timezone.
 *
 * `LedgerEntry` is a type-only import — erased at build, so the `server-only`
 * `lib/cellgods` module never reaches this client bundle.
 */

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

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason.toLowerCase()] ?? reason;
}

// Format with an EXPLICIT locale + timezone so the server and client render the
// exact same string — deterministic output means no SSR↔CSR hydration mismatch
// (and no need for a mount-gated effect).
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "America/New_York",
});

function formatLedgerDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

export default function LedgerTable({
  entries,
  currency = "usd",
}: {
  entries: LedgerEntry[];
  currency?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="px-1 py-12 text-center text-sm text-muted-foreground">
        No transactions yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e, i) => {
          const positive = e.delta_cents >= 0;
          return (
            <TableRow key={`${e.created_at}-${i}`}>
              <TableCell className="text-muted-foreground">
                {formatLedgerDate(e.created_at)}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {reasonLabel(e.reason)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  positive ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {positive ? "+" : ""}
                {fmtMoney(e.delta_cents, currency)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-foreground">
                {fmtMoney(e.balance_after_cents, currency)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
