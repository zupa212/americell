import { Database } from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import { listCustomers, type CustomerRow } from "@/lib/admin-data";
import { isDbConfigured } from "@/lib/db";
import CustomersTable from "@/components/admin/customers-table";
import { AuroraText } from "@/components/ui/aurora-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Admin CUSTOMERS page (RESELLER_PLAN §6) — owner-only, Server Component.
 *
 * Reads one aggregated row per user (signup date, rentals count, total spend)
 * through the `server-only` {@link listCustomers}, then hands the plain rows to
 * the presentational {@link CustomersTable} client component for client-side
 * search + sort. This is a pure READ — no CellGods calls, no mutations — so
 * there is nothing to write to the audit log here.
 *
 * The `/admin` layout already gates access; we re-assert `requireAdminPage()`
 * as defence-in-depth (§6.1 — every layer re-checks). `force-dynamic` because
 * the customer book is live per-request and must never be prerendered.
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — matches the rest of the cockpit, floats over
// the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

export default async function AdminCustomersPage() {
  await requireAdminPage();

  // `listCustomers` already fails safe to `[]` when the DB is unconfigured; we
  // still branch on `isDbConfigured` so we can show a setup hint instead of a
  // misleading "no customers yet" empty state.
  const rows: CustomerRow[] = await listCustomers();

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <AuroraText>Customers</AuroraText>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every customer account with signup date, rentals count, and total
          spend.
        </p>
      </Reveal>

      {!isDbConfigured ? (
        <Reveal delay={0.05}>
          <Alert className={cn("border-white/50 bg-white/60 backdrop-blur-md")}>
            <Database className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>The database isn&apos;t configured yet.</AlertTitle>
            <AlertDescription>
              Add <code>DATABASE_URL</code> to the environment to show customers
              here.
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : (
        <Reveal delay={0.05}>
          <div className={cn("overflow-hidden", glassCard)}>
            <CustomersTable rows={rows} />
          </div>
        </Reveal>
      )}
    </div>
  );
}
