import { Radio, Receipt, TrendingUp, Wallet } from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import { listAllRentals, type AdminRentalRow } from "@/lib/admin-data";
import RentalsTable from "@/components/admin/rentals-table";
import { StatCard } from "@/components/admin/stat-card";
import { AuroraText } from "@/components/ui/aurora-text";
import LottiePlayer from "@/components/ui/lottie";
import Reveal from "@/components/ui/reveal";
import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Admin RENTALS page (RESELLER_PLAN §6.2) — owner-only, Server Component.
 *
 * Reads the local `rentals` book directly through `lib/admin-data`
 * (`isDbConfigured`-guarded, so it safely returns `[]` before a DB exists) and
 * hands the rows to a presentational client table. Unlike the ORDERS page —
 * which mirrors live CellGods state — this view is the AMERICELL side of the
 * ledger: retail vs. wholesale vs. margin per rental.
 *
 * The gate runs in `app/admin/layout.tsx`; we re-assert it here as
 * defence-in-depth (§6.1 — every layer re-checks). `force-dynamic`: the book
 * is live and per-request, never cache it.
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

/** Statuses that count as money captured & kept (excludes never-charged / refunded). */
const BOOKED_STATUSES = (status: string) =>
  status !== "pending_payment" && status !== "refunded";

/** Statuses that count as a live device on the book (§5.4: `pooled` ≈ active). */
const LIVE_STATUSES = new Set(["active", "pooled"]);

export default async function AdminRentalsPage() {
  await requireAdminPage();

  const rentals: AdminRentalRow[] = await listAllRentals();

  // Headline figures derived from the loaded book — no extra queries.
  const totalRentals = rentals.length;
  const liveRentals = rentals.filter((r) => LIVE_STATUSES.has(r.status)).length;
  const bookedRetailCents = rentals
    .filter((r) => BOOKED_STATUSES(r.status))
    .reduce((sum, r) => sum + r.retailCents, 0);
  const grossMarginCents = rentals.reduce(
    (sum, r) => sum + (r.marginCents ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <AuroraText>Rentals</AuroraText>
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Every AMERICELL rental — retail price, the wholesale charge from
              CellGods, and the margin per device.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md ring-1 ring-white/40 dark:bg-white/10">
            <LottiePlayer src="/lottie/pulse.json" className="h-4 w-4" />
            Live ledger
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Rentals loaded"
            value={totalRentals.toLocaleString("en-US")}
            sub="Newest first"
            icon={<Receipt />}
          />
          <StatCard
            label="Live devices"
            value={liveRentals.toLocaleString("en-US")}
            sub="Active or pooled"
            icon={<Radio />}
            accent={<LottiePlayer src="/lottie/pulse.json" className="h-24 w-24" />}
          />
          <StatCard
            label="Booked retail"
            value={fmtMoney(bookedRetailCents)}
            sub="Captured & kept"
            icon={<Wallet />}
          />
          <StatCard
            label="Gross margin"
            value={fmtMoney(grossMarginCents)}
            sub="Retail − wholesale"
            icon={<TrendingUp />}
            tone="positive"
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className={cn("overflow-hidden", glassCard)}>
          <RentalsTable rentals={rentals} />
        </div>
      </Reveal>
    </div>
  );
}
