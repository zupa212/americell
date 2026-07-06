import { Suspense } from "react";
import {
  Database,
  Receipt,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import { listCustomers, type CustomerRow } from "@/lib/admin-data";
import { isDbConfigured } from "@/lib/db";
import { fmtMoney } from "@/lib/money";
import CustomersTable from "@/components/admin/customers-table";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { AuroraText } from "@/components/ui/aurora-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LottiePlayer from "@/components/ui/lottie";
import Reveal from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Admin CUSTOMERS page (RESELLER_PLAN §6) — owner-only, Server Component.
 *
 * Reads one aggregated row per user (signup date, rentals count, total spend)
 * through the `server-only` {@link listCustomers}, derives headline KPIs, then
 * hands the plain rows to the presentational {@link CustomersTable} client
 * component for client-side search / segment / sort. This is a pure READ — no
 * CellGods calls, no mutations — so there is nothing to write to the audit log.
 *
 * The `/admin` layout already gates access; we re-assert `requireAdminPage()`
 * as defence-in-depth (§6.1 — every layer re-checks). `force-dynamic` because
 * the customer book is live per-request and must never be prerendered. The DB
 * read streams inside a <Suspense> boundary so the header paints immediately
 * with a designed skeleton in place of the table.
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — matches the rest of the cockpit, floats over
// the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const num = (n: number) => n.toLocaleString("en-US");

export default async function AdminCustomersPage() {
  await requireAdminPage();

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <AuroraText>Customers</AuroraText>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Every customer account with signup date, rentals count, and total
              spend.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-white/40 backdrop-blur-md">
            <LottiePlayer src="/lottie/pulse.json" className="h-4 w-4" />
            Live book
          </span>
        </div>
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
        <Suspense fallback={<CustomersLoading />}>
          <CustomersSection />
        </Suspense>
      )}
    </div>
  );
}

/**
 * Streams the DB read: aggregates the rows into KPI tiles, then renders the
 * interactive table (or a Lottie empty-state when there are no customers yet).
 */
async function CustomersSection() {
  const rows: CustomerRow[] = await listCustomers();
  const generatedAt = new Date().toISOString();

  const total = rows.length;
  const paying = rows.filter((r) => r.totalSpentCents > 0).length;
  const withRentals = rows.filter((r) => r.rentalsCount > 0).length;
  const revenueCents = rows.reduce((sum, r) => sum + r.totalSpentCents, 0);
  const totalRentals = rows.reduce((sum, r) => sum + r.rentalsCount, 0);
  const payingPct = total > 0 ? Math.round((paying / total) * 100) : 0;
  const avgSpendCents = paying > 0 ? Math.round(revenueCents / paying) : 0;

  return (
    <>
      <Reveal delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Customers"
            value={num(total)}
            sub={`${num(withRentals)} with rentals`}
            icon={<Users />}
          />
          <StatCard
            label="Paying customers"
            value={num(paying)}
            sub={total > 0 ? `${payingPct}% of accounts` : "no accounts yet"}
            icon={<UserRoundCheck />}
          />
          <StatCard
            label="Lifetime revenue"
            value={fmtMoney(revenueCents)}
            sub={
              paying > 0
                ? `avg ${fmtMoney(avgSpendCents)} / paying`
                : "no spend yet"
            }
            icon={<Wallet />}
          />
          <StatCard
            label="Total rentals"
            value={num(totalRentals)}
            sub="all-time, across accounts"
            icon={<Receipt />}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        {rows.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Customer accounts will appear here as people sign up and rent US devices."
          />
        ) : (
          <div className={cn("overflow-hidden", glassCard)}>
            <CustomersTable rows={rows} generatedAt={generatedAt} />
          </div>
        )}
      </Reveal>
    </>
  );
}

/** Designed loading state shown while the customer aggregate streams in. */
function CustomersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("p-5", glassCard)}>
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-3 w-24 bg-white/50" />
              <Skeleton className="h-8 w-8 rounded-xl bg-white/50" />
            </div>
            <Skeleton className="mt-4 h-8 w-28 bg-white/50" />
            <Skeleton className="mt-2 h-3 w-20 bg-white/50" />
          </div>
        ))}
      </div>

      <div className={cn("overflow-hidden", glassCard)}>
        <div className="flex flex-col gap-3 border-b border-white/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-9 w-full max-w-xs rounded-xl bg-white/50" />
            <Skeleton className="h-9 w-36 rounded-xl bg-white/50" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-28 bg-white/50" />
            <Skeleton className="h-9 w-24 rounded-xl bg-white/50" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-4 py-8">
          <LottiePlayer src="/lottie/loader.json" className="h-10 w-10" />
          <span className="text-sm text-muted-foreground">
            Loading customers…
          </span>
        </div>
        <div className="divide-y divide-white/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full bg-white/50" />
              <Skeleton className="h-4 flex-1 max-w-[16rem] bg-white/50" />
              <Skeleton className="hidden h-4 w-24 bg-white/50 sm:block" />
              <Skeleton className="ml-auto h-5 w-10 rounded-full bg-white/50" />
              <Skeleton className="h-4 w-16 bg-white/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
