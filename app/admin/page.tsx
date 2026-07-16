import type { ReactNode } from "react";
import Link from "next/link";
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Percent,
  ScrollText,
  Smartphone,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  CellgodsError,
  getBalance,
  getInventory,
  getOrders,
  isCellgodsConfigured,
  type Balance,
  type InventoryPhone,
  type Order,
} from "@/lib/cellgods";
import { getMarginOpts, toPublicRetailPhone } from "@/lib/pricing";
import { fmtMoney } from "@/lib/money";
import {
  adminKpis,
  revenueByDay,
  type AdminKpis,
  type RevenuePoint,
} from "@/lib/admin-data";
import { listLogs } from "@/lib/logs";
import { isDbConfigured } from "@/lib/db";
import type { ActivityLog } from "@/db/schema";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import OverviewOrders, {
  type OverviewOrderRow,
} from "@/components/admin/overview-orders";
import OverviewActivity, {
  type ActivityRow,
} from "@/components/admin/overview-activity";
import OverviewRefreshButton from "@/components/admin/overview-refresh";
import LottiePlayer from "@/components/ui/lottie";
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// This cockpit reads live CellGods + DB data on every request — never prerender it.
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// CellGods order statuses that count as a live rental (§5.4: `pooled` ≈ active).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/** How many orders to surface in the "recent" table. */
const RECENT_LIMIT = 10;

/** How many audit-log entries to surface in the activity feed. */
const LOG_LIMIT = 8;

/** Window (days) for the booked-revenue trend chart. */
const REVENUE_DAYS = 14;

/**
 * Low-credit warning floor when no auto-topup threshold is configured (~$50).
 * If the reseller HAS set an auto-topup threshold we warn below THAT instead,
 * so the alert tracks the operator's own low-water mark.
 */
const LOW_CREDIT_FLOOR_CENTS = 5000;

const EMPTY_KPIS: AdminKpis = {
  totalRentals: 0,
  activeRentals: 0,
  expiredRentals: 0,
  revenueCents: 0,
  grossMarginCents: 0,
  customersCount: 0,
};

/**
 * Message for a CellGods HTTP status (the §6.2 status map). Anything unmapped
 * (incl. status 0 network/timeout) falls back to the 500 copy.
 */
function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request";
    case 401:
      return "Missing API key";
    case 402:
      return "Insufficient balance — add credit";
    case 403:
      return "Invalid API key";
    case 404:
      return "Not found";
    case 409:
      return "This device is no longer available";
    case 429:
      return "Too many requests";
    default:
      return "Server error";
  }
}

/** Safely read a finite number out of an unknown jsonb metadata blob. */
function metaNumber(metadata: unknown, key: string): number | null {
  if (metadata && typeof metadata === "object" && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

const num = (n: number) => n.toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

type OverviewData = {
  balance: Balance;
  orders: Order[];
  inventory: InventoryPhone[];
};

/**
 * Fetch the three live CellGods reads in parallel, failing closed to a notice.
 * Never throws: unconfigured → setup hint; `CellgodsError` → mapped copy.
 */
async function loadOverview(): Promise<
  { ok: true; data: OverviewData } | { ok: false; message: string }
> {
  if (!isCellgodsConfigured) {
    return {
      ok: false,
      message:
        "The CellGods API is not configured. Add CELLGODS_API_KEY for live data.",
    };
  }

  try {
    const [balance, orders, inventory] = await Promise.all([
      getBalance(),
      getOrders(),
      getInventory(),
    ]);
    return { ok: true, data: { balance, orders, inventory } };
  } catch (err) {
    if (err instanceof CellgodsError) {
      return { ok: false, message: messageForStatus(err.status) };
    }
    return { ok: false, message: "Server error" };
  }
}

type DbData = { kpis: AdminKpis; logs: ActivityLog[]; revenue: RevenuePoint[] };

/**
 * Load the DB-backed cockpit reads (KPIs, activity feed, revenue trend) in
 * parallel. Each helper is `isDbConfigured`-guarded and returns safe empties,
 * but we still fail closed here so a transient DB error degrades to zeros
 * instead of taking down the whole page.
 */
async function loadDb(): Promise<{ configured: boolean; data: DbData }> {
  const empty: DbData = { kpis: EMPTY_KPIS, logs: [], revenue: [] };
  if (!isDbConfigured) return { configured: false, data: empty };

  try {
    const [kpis, logs, revenue] = await Promise.all([
      adminKpis(),
      listLogs({ limit: LOG_LIMIT }),
      revenueByDay(REVENUE_DAYS),
    ]);
    return { configured: true, data: { kpis, logs, revenue } };
  } catch (err) {
    console.error("[admin/overview] DB read failed", err);
    return { configured: true, data: empty };
  }
}

// ---------------------------------------------------------------------------
// Presentational fragments
// ---------------------------------------------------------------------------

function SectionHeading({
  title,
  icon: Icon,
  aside,
}: {
  title: string;
  icon?: LucideIcon;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        {Icon ? (
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand ring-1 ring-white/50"
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        {title}
      </h2>
      {aside ? (
        <span className="text-sm text-muted-foreground">{aside}</span>
      ) : null}
    </div>
  );
}

function InlineNotice({
  title = "Could not load data",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 p-5", glassCard)}>
      <TriangleAlert
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/** A glass quick-action link tile used in the "Quick actions" row. */
function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border p-4 outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        primary
          ? "border-white/30 bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-white shadow-[0_14px_44px_-16px_rgba(43,107,255,0.6)] ring-1 ring-white/30 hover:shadow-[0_20px_60px_-18px_rgba(43,107,255,0.7)]"
          : "border-white/50 bg-white/60 text-foreground ring-1 ring-white/40 backdrop-blur-md hover:bg-white/75",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl [&_svg]:h-5 [&_svg]:w-5",
          primary
            ? "bg-white/20 text-white ring-1 ring-white/30"
            : "bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand ring-1 ring-white/50",
        )}
      >
        <Icon />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p
          className={cn(
            "truncate text-xs",
            primary ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {desc}
        </p>
      </div>
      <ChevronRight
        aria-hidden="true"
        className={cn(
          "ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
          primary ? "text-white/80" : "text-muted-foreground",
        )}
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminOverviewPage() {
  const [cgResult, dbResult] = await Promise.all([loadOverview(), loadDb()]);

  const cg = cgResult.ok ? cgResult.data : null;
  const { kpis, logs, revenue } = dbResult.data;
  const dbConfigured = dbResult.configured;
  const generatedAt = new Date().toISOString();

  const currency = cg?.balance.currency || "usd";

  // --- CellGods live derivations (only when the live read succeeded) ---------
  let activeOrders: Order[] = [];
  let availableCount = 0;
  let marginCents = 0;
  let orderRows: OverviewOrderRow[] = [];
  let isLowCredit = false;
  let lowThresholdCents = LOW_CREDIT_FLOOR_CENTS;

  if (cg) {
    const byPhoneId = new Map(cg.inventory.map((p) => [p.phone_id, p]));
    activeOrders = cg.orders.filter((o) => ACTIVE_STATUSES.has(o.status));
    availableCount = cg.inventory.filter((p) => p.status === "available").length;

    // §6.2 margin ESTIMATE — join active orders → inventory, approximate each as
    // a monthly rental using the SAME `toPublicRetailPhone` path as checkout.
    // wholesale = price_monthly; margin = Σretail − Σwholesale. Unmatched skip.
    let retailSum = 0;
    let wholesaleSum = 0;
    const marginOpts = await getMarginOpts();
    for (const order of activeOrders) {
      const item = byPhoneId.get(order.phone_id);
      if (!item) continue;
      retailSum += toPublicRetailPhone(item, marginOpts).retail.monthly;
      wholesaleSum += item.price_monthly ?? 0;
    }
    marginCents = retailSum - wholesaleSum;

    // "Recent" proxy: CellGods orders carry no created_at, so order by expiry
    // (latest-expiring ≈ most-recently activated) and take the top N. Mapped to a
    // lean, serializable shape for the client table.
    orderRows = [...cg.orders]
      .sort((a, b) => Date.parse(b.expires_at) - Date.parse(a.expires_at))
      .slice(0, RECENT_LIMIT)
      .map((order) => ({
        orderId: order.order_id,
        model: byPhoneId.get(order.phone_id)?.model ?? order.phone_id,
        customerEmail: order.customer_email,
        status: order.status,
        expiresAt: order.expires_at,
      }));

    // Low-credit signal: warn below the operator's auto-topup threshold if set,
    // otherwise below a sane floor.
    lowThresholdCents =
      cg.balance.auto_topup.threshold_cents > 0
        ? cg.balance.auto_topup.threshold_cents
        : LOW_CREDIT_FLOOR_CENTS;
    isLowCredit = cg.balance.credit_balance_cents < lowThresholdCents;
  }

  // Audit-log rows → lean, serializable shape (amount pre-resolved for top-ups).
  const activityRows: ActivityRow[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    actorType: log.actorType,
    actorEmail: log.actorEmail,
    createdAt: log.createdAt.toISOString(),
    amountCents:
      log.action === "admin.topup" || log.action === "admin.auto_topup"
        ? metaNumber(log.metadata, "amount_cents")
        : null,
  }));

  const showRevenueChart = dbConfigured && revenue.length > 0;
  const totalOrders = cg?.orders.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-1 py-4 sm:px-3 sm:py-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Reveal>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-white/40 backdrop-blur-md">
                <LottiePlayer src="/lottie/pulse.json" className="h-4 w-4" />
                Live cockpit
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              <AuroraText>Overview</AuroraText>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Live view of credit, revenue, rentals and activity — the full
              AMERICELL cockpit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OverviewRefreshButton generatedAt={generatedAt} />
            <Link
              href="/admin/inventory"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/50 bg-white/60 px-3 text-sm font-medium text-foreground backdrop-blur-md transition-colors hover:bg-white/75 [&_svg]:h-4 [&_svg]:w-4"
            >
              <Boxes />
              Inventory
            </Link>
            <Link
              href="/admin/billing"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/30 bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-3 text-sm font-medium text-white shadow-[0_10px_30px_-12px_rgba(43,107,255,0.6)] ring-1 ring-white/30 transition-all hover:opacity-95 [&_svg]:h-4 [&_svg]:w-4"
            >
              <Wallet />
              Top up
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Prominent operational alert: low reseller credit blocks activations. */}
      {isLowCredit && cg ? (
        <Reveal delay={0.03}>
          <Alert
            variant="destructive"
            className="mt-6 rounded-3xl border-red-300/60 bg-red-50/70 p-4 shadow-[0_10px_40px_-12px_rgba(190,30,45,0.28)] ring-1 ring-red-200/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100/70 ring-1 ring-red-200/60"
              >
                <LottiePlayer src="/lottie/pulse.json" className="h-9 w-9" />
              </span>
              <div className="min-w-0 flex-1">
                <AlertTitle>Low credit balance</AlertTitle>
                <AlertDescription>
                  Balance{" "}
                  <strong className="text-destructive">
                    {fmtMoney(cg.balance.credit_balance_cents, currency)}
                  </strong>{" "}
                  dropped below the {fmtMoney(lowThresholdCents, currency)}{" "}
                  threshold. New activations may fail until you add credit.
                </AlertDescription>
              </div>
              <Link
                href="/admin/billing"
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-red-300/60 bg-white/70 px-3 text-sm font-medium text-destructive backdrop-blur-md transition-colors hover:bg-white/90 [&_svg]:h-4 [&_svg]:w-4"
              >
                <Wallet />
                Top up now
              </Link>
            </div>
          </Alert>
        </Reveal>
      ) : null}

      {/* ── Live CellGods stats ─────────────────────────────────────────── */}
      <Reveal delay={0.05}>
        <section className="mt-8">
          <SectionHeading
            title="Live CellGods data"
            icon={Zap}
            aside={
              cg
                ? cg.balance.auto_topup.enabled
                  ? "Auto top-up: on"
                  : "Auto top-up: off"
                : undefined
            }
          />
          {cg ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Hero: credit balance, with a subtle Lottie pulse + top-up CTA. */}
              <StatCard
                size="lg"
                className="sm:col-span-2"
                label="Credit balance"
                value={fmtMoney(cg.balance.credit_balance_cents, currency)}
                tone={isLowCredit ? "warning" : "default"}
                icon={<Wallet />}
                accent={
                  <LottiePlayer
                    src="/lottie/pulse.json"
                    className="h-28 w-28"
                  />
                }
                sub={
                  isLowCredit
                    ? `below ${fmtMoney(lowThresholdCents, currency)} threshold`
                    : cg.balance.auto_topup.enabled
                      ? `auto top-up at ${fmtMoney(lowThresholdCents, currency)}`
                      : "auto top-up off"
                }
                footer={
                  <Link
                    href="/admin/billing"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-2"
                  >
                    Manage billing
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                }
              />
              <StatCard
                label="Active orders"
                value={num(activeOrders.length)}
                sub={`${num(cg.orders.length)} total`}
                icon={<ClipboardList />}
              />
              <StatCard
                label="Available devices"
                value={num(availableCount)}
                sub={`${num(cg.inventory.length)} in inventory`}
                icon={<Smartphone />}
              />
              <StatCard
                label="Estimated margin"
                value={fmtMoney(marginCents, currency)}
                sub="estimate / month"
                tone={marginCents > 0 ? "positive" : "default"}
                icon={<TrendingUp />}
              />
            </div>
          ) : (
            <InlineNotice message={cgResult.ok ? "" : cgResult.message} />
          )}
        </section>
      </Reveal>

      {/* ── DB KPIs ─────────────────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section className="mt-10">
          <SectionHeading
            title="Business metrics"
            icon={TrendingUp}
            aside={dbConfigured ? `${num(kpis.totalRentals)} rentals` : undefined}
          />
          {dbConfigured ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total revenue"
                value={fmtMoney(kpis.revenueCents, currency)}
                sub="active book"
                icon={<DollarSign />}
                accent={
                  <LottiePlayer src="/lottie/pulse.json" className="h-24 w-24" />
                }
              />
              <StatCard
                label="Gross margin"
                value={fmtMoney(kpis.grossMarginCents, currency)}
                sub="retail − wholesale"
                tone={kpis.grossMarginCents > 0 ? "positive" : "default"}
                icon={<Percent />}
              />
              <StatCard
                label="Active rentals"
                value={num(kpis.activeRentals)}
                sub={`${num(kpis.expiredRentals)} expired`}
                icon={<Zap />}
              />
              <StatCard
                label="Customers"
                value={num(kpis.customersCount)}
                sub="registered"
                icon={<Users />}
              />
            </div>
          ) : (
            <InlineNotice
              title="The database is not configured"
              message="Add DATABASE_URL for revenue, margin, rentals, customers and activity history."
            />
          )}
        </section>
      </Reveal>

      {/* ── Revenue trend (sibling RevenueChart) ────────────────────────── */}
      {showRevenueChart ? (
        <Reveal delay={0.13}>
          <section className="mt-10">
            <SectionHeading
              title="Revenue"
              icon={DollarSign}
              aside={`last ${num(REVENUE_DAYS)} days`}
            />
            {/* RevenueChart renders its own glass surface — no double wrapper. */}
            <RevenueChart data={revenue} currency={currency} />
          </section>
        </Reveal>
      ) : null}

      {/* ── Recent orders + activity feed ───────────────────────────────── */}
      <Reveal delay={0.16}>
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {cg ? (
            <OverviewOrders rows={orderRows} total={totalOrders} />
          ) : (
            <InlineNotice
              title="Recent orders"
              message={cgResult.ok ? "" : cgResult.message}
            />
          )}

          {dbConfigured ? (
            <OverviewActivity rows={activityRows} currency={currency} />
          ) : (
            <InlineNotice
              title="Recent activity"
              message="A database connection is required for activity history."
            />
          )}
        </section>
      </Reveal>

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <Reveal delay={0.19}>
        <section className="mt-10">
          <SectionHeading title="Quick actions" icon={Sparkles} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              href="/admin/billing"
              icon={Wallet}
              label="Top up credit"
              desc="Add reseller balance"
              primary
            />
            <QuickAction
              href="/admin/inventory"
              icon={Boxes}
              label="Inventory"
              desc="Devices & availability"
            />
            <QuickAction
              href="/admin/rentals"
              icon={Smartphone}
              label="Rentals"
              desc="Active device sessions"
            />
            <QuickAction
              href="/admin/logs"
              icon={ScrollText}
              label="Audit logs"
              desc="Full activity trail"
            />
          </div>
        </section>
      </Reveal>
    </div>
  );
}
