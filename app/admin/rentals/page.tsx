import { requireAdminPage } from "@/lib/admin";
import { listAllRentals, type AdminRentalRow } from "@/lib/admin-data";
import RentalsTable from "@/components/admin/rentals-table";
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
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

export default async function AdminRentalsPage() {
  await requireAdminPage();

  const rentals: AdminRentalRow[] = await listAllRentals();

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <AuroraText>Rentals</AuroraText>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every AMERICELL rental — retail price, the wholesale charge from
          CellGods, and the margin per device.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className={cn("overflow-hidden", glassCard)}>
          <RentalsTable rentals={rentals} />
        </div>
      </Reveal>
    </div>
  );
}
