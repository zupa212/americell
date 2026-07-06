"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  currency: string;
  priceMonthlyCents: number | null; // wholesale
  retailMonthlyCents: number | null; // computed retail estimate (same math as checkout)
};

type DurationOption = {
  period: BillingPeriod;
  days: number;
  labelEl: string;
};

type InventoryTableProps = {
  rows: InventoryRow[];
  durations: readonly DurationOption[];
};

const PLATFORM_LABEL: Record<Platform, string> = {
  iphone: "iPhone",
  android: "Android",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Διαθέσιμο",
  rented: "Σε χρήση",
  active: "Σε χρήση",
  pooled: "Δεσμευμένο",
  unavailable: "Μη διαθέσιμο",
};

function money(cents: number | null, currency: string): string {
  return cents == null ? "—" : fmtMoney(cents, currency);
}

/**
 * InventoryTable — admin live inventory (RESELLER_PLAN §6.2).
 *
 * A wide, horizontally-scrollable shadcn Table over `InventoryRow[]`. Wholesale
 * `price_monthly` and the retail estimate ("εκτίμηση") are shown side by side;
 * each `available` phone gets an "Ενεργοποίηση" action that opens
 * {@link ActivateDialog} for that phone.
 */
export default function InventoryTable({
  rows,
  durations,
}: InventoryTableProps) {
  const [target, setTarget] = useState<ActivatePhone | null>(null);

  if (rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          Κανένα απόθεμα αυτή τη στιγμή
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Δεν βρέθηκαν συσκευές. Δοκίμασε ξανά σε λίγο — το απόθεμα αλλάζει
          συνεχώς.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Μοντέλο</TableHead>
              <TableHead>Τύπος</TableHead>
              <TableHead>Κατάσταση</TableHead>
              <TableHead className="text-right">Χονδρική / μήνα</TableHead>
              <TableHead className="text-right">Λιανική (εκτ.)</TableHead>
              <TableHead className="text-right">Ενέργεια</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.phoneId}>
                <TableCell className="font-medium text-foreground">
                  {row.model}
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
                          ? "bg-emerald-500"
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
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
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
                    >
                      <Zap className="size-3.5" aria-hidden />
                      Ενεργοποίηση
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ActivateDialog
        key={target?.phoneId ?? "closed"}
        phone={target}
        durations={durations}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
