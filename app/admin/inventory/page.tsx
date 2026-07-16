import { Database, TriangleAlert } from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import {
  getInventory,
  isCellgodsConfigured,
  type InventoryPhone,
} from "@/lib/cellgods";
import {
  DURATIONS,
  getDeviceOverrides,
  getMarginOpts,
  resolveMarginOpts,
  toPublicRetailPhone,
  type MarginOpts,
} from "@/lib/pricing";
import InventoryTable, {
  type InventoryRow,
} from "@/components/admin/inventory-table";
import { AuroraText } from "@/components/ui/aurora-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Admin › Inventory (RESELLER_PLAN §6.2) — Server Component.
 *
 * Reads LIVE CellGods inventory straight through `lib/cellgods` (the browser
 * never sees the API key). Wholesale `price_monthly` and the retail estimate
 * (same `toPublicRetailPhone` math as customer checkout) are projected to
 * `InventoryRow[]` and handed to the client table. Owner-gated via
 * `requireAdminPage()` — anon → /login, non-owner → 404.
 *
 * `force-dynamic`: inventory is volatile and per-request; never cache it.
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface — floats over the global aurora (SiteBackground). Matches
// the rest of the cockpit.
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

/** Project a raw inventory phone to the admin table row (retail estimate = checkout math). */
function toRow(p: InventoryPhone, opts: MarginOpts): InventoryRow {
  const hasMonthly = p.price_monthly != null;
  return {
    phoneId: p.phone_id,
    model: p.model,
    platform: p.type,
    status: p.status,
    available: p.status === "available",
    currency: p.currency,
    priceMonthlyCents: p.price_monthly,
    // Only estimate retail when there's a wholesale monthly price to mark up.
    retailMonthlyCents: hasMonthly
      ? toPublicRetailPhone(p, opts).retail.monthly
      : null,
  };
}

export default async function AdminInventoryPage() {
  await requireAdminPage();

  let rows: InventoryRow[] = [];
  let state: "ok" | "unconfigured" | "error" = "ok";

  if (!isCellgodsConfigured) {
    state = "unconfigured";
  } else {
    try {
      const [inventory, opts, overrides] = await Promise.all([
        getInventory(),
        getMarginOpts(),
        getDeviceOverrides(),
      ]);
      rows = inventory.map((p) =>
        toRow(p, resolveMarginOpts(opts, overrides[p.phone_id])),
      );
    } catch {
      state = "error";
    }
  }

  // Snapshot time for the table's live "updated ago" indicator (per-request).
  const generatedAt = new Date().toISOString();

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <AuroraText>Inventory</AuroraText>
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Live CellGods inventory with wholesale price and estimated retail.
          Search, filter, and activate an available device for a customer.
        </p>
      </Reveal>

      {state === "unconfigured" ? (
        <Reveal delay={0.05}>
          <Alert className={cn("border-white/50 bg-white/60 backdrop-blur-md")}>
            <Database className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Demo mode</AlertTitle>
            <AlertDescription>
              The CellGods API isn&apos;t configured yet, so there&apos;s no live
              inventory to show. Add the API credentials to the environment to
              see devices here.
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : state === "error" ? (
        <Reveal delay={0.05}>
          <Alert
            variant="destructive"
            className={cn("border-white/50 bg-white/60 backdrop-blur-md")}
          >
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Failed to load</AlertTitle>
            <AlertDescription>
              Couldn&apos;t load inventory. Refresh the page and try again.
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : (
        <Reveal delay={0.05}>
          <div className={cn("overflow-hidden", glassCard)}>
            <InventoryTable
              rows={rows}
              durations={DURATIONS}
              generatedAt={generatedAt}
            />
          </div>
        </Reveal>
      )}
    </div>
  );
}
