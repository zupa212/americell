import type { ReactNode } from "react";
import {
  Activity,
  ClipboardList,
  CreditCard,
  DollarSign,
  Percent,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
  Zap,
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
import { toPublicRetailPhone } from "@/lib/pricing";
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
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// This cockpit reads live CellGods + DB data on every request — never prerender it.
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// Small glass chip that hosts a leading glyph in list rows.
const glassChip =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand backdrop-blur-md [&_svg]:h-4 [&_svg]:w-4";

// CellGods order statuses that count as a live rental (§5.4: `pooled` ≈ active).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/** How many orders to surface in the "recent" list. */
const RECENT_LIMIT = 8;

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

type BadgeVariant = "default" | "secondary" | "outline";

/** Order status → label + Badge variant. */
function orderStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "active":
    case "pooled":
      return { label: "active", variant: "default" };
    case "expired":
      return { label: "expired", variant: "outline" };
    case "deactivated":
      return { label: "cancelled", variant: "outline" };
    default:
      return { label: status, variant: "secondary" };
  }
}

/** Actor type → label + Badge variant for the activity feed. */
function actorTypeBadge(actorType: string): { label: string; variant: BadgeVariant } {
  switch (actorType) {
    case "admin":
      return { label: "Admin", variant: "default" };
    case "customer":
      return { label: "Customer", variant: "secondary" };
    case "system":
      return { label: "System", variant: "outline" };
    default:
      return { label: actorType, variant: "secondary" };
  }
}

/** Audit-log action → label (naming convention from lib/logs.ts). */
const ACTION_LABELS: Record<string, string> = {
  "customer.signup": "New customer signup",
  "customer.login": "Customer login",
  "checkout.started": "Checkout started",
  "rental.activated": "Rental activated",
  "rental.refunded": "Refund issued",
  "rental.pending_credit": "Credit pending",
  "rental.cancelled": "Rental cancelled",
  "admin.activate": "Activated by admin",
  "admin.deactivate": "Deactivated by admin",
  "admin.topup": "Credit top-up",
  "admin.auto_topup": "Automatic credit top-up",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** Pick a leading glyph for an audit-log row from its action namespace. */
function logIcon(action: string): ReactNode {
  if (action.startsWith("admin.")) return <ShieldCheck />;
  if (action === "customer.signup" || action === "customer.login")
    return <UserRound />;
  if (action === "checkout.started") return <CreditCard />;
  if (action === "rental.refunded") return <RotateCcw />;
  if (action.startsWith("rental.")) return <Smartphone />;
  return <Activity />;
}

/** Safely read a finite number out of an unknown jsonb metadata blob. */
function metaNumber(metadata: unknown, key: string): number | null {
  if (metadata && typeof metadata === "object" && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

/** Format an ISO timestamp for display (server-rendered, no hydration). */
function fmtDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(t);
}

/** Compact relative time ("5 minutes ago"), computed at render. */
function fmtRelative(value: Date): string {
  const t = value.getTime();
  if (Number.isNaN(t)) return "—";
  const diffSec = Math.round((t - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), "month");
  return rtf.format(Math.round(diffSec / 31536000), "year");
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

function OverviewHeader() {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        Admin dashboard
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
        <AuroraText>Overview</AuroraText>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Live view of credit, revenue, rentals and activity — the full AMERICELL
        cockpit.
      </p>
    </div>
  );
}

function SectionHeading({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {aside ? (
        <span className="text-sm text-muted-foreground">{aside}</span>
      ) : null}
    </div>
  );
}

function InlineNotice({ message }: { message: string }) {
  return (
    <div className={cn("flex items-start gap-3 p-5", glassCard)}>
      <TriangleAlert
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-foreground">
          Could not load data
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
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

  const currency = cg?.balance.currency || "usd";

  // --- CellGods live derivations (only when the live read succeeded) ---------
  let activeOrders: Order[] = [];
  let availableCount = 0;
  let marginCents = 0;
  let recent: Order[] = [];
  let byPhoneId = new Map<string, InventoryPhone>();
  let isLowCredit = false;
  let lowThresholdCents = LOW_CREDIT_FLOOR_CENTS;

  if (cg) {
    byPhoneId = new Map(cg.inventory.map((p) => [p.phone_id, p]));
    activeOrders = cg.orders.filter((o) => ACTIVE_STATUSES.has(o.status));
    availableCount = cg.inventory.filter((p) => p.status === "available").length;

    // §6.2 margin ESTIMATE — join active orders → inventory, approximate each as
    // a monthly rental using the SAME `toPublicRetailPhone` path as checkout.
    // wholesale = price_monthly; margin = Σretail − Σwholesale. Unmatched skip.
    let retailSum = 0;
    let wholesaleSum = 0;
    for (const order of activeOrders) {
      const item = byPhoneId.get(order.phone_id);
      if (!item) continue;
      retailSum += toPublicRetailPhone(item).retail.monthly;
      wholesaleSum += item.price_monthly ?? 0;
    }
    marginCents = retailSum - wholesaleSum;

    // "Recent" proxy: CellGods orders carry no created_at, so order by expiry
    // (latest-expiring ≈ most-recently activated) and take the top N.
    recent = [...cg.orders]
      .sort((a, b) => Date.parse(b.expires_at) - Date.parse(a.expires_at))
      .slice(0, RECENT_LIMIT);

    // Low-credit signal: warn below the operator's auto-topup threshold if set,
    // otherwise below a sane floor.
    lowThresholdCents =
      cg.balance.auto_topup.threshold_cents > 0
        ? cg.balance.auto_topup.threshold_cents
        : LOW_CREDIT_FLOOR_CENTS;
    isLowCredit = cg.balance.credit_balance_cents < lowThresholdCents;
  }

  const showRevenueChart = dbConfigured && revenue.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Reveal>
        <OverviewHeader />
      </Reveal>

      {/* Prominent operational alert: low reseller credit blocks activations. */}
      {isLowCredit && cg ? (
        <Reveal delay={0.03}>
          <Alert
            variant="destructive"
            className="mt-6 items-center rounded-2xl border-red-300/60 bg-red-50/70 px-4 py-3 shadow-[0_10px_40px_-12px_rgba(190,30,45,0.28)] ring-1 ring-red-200/50 backdrop-blur-xl"
          >
            <TriangleAlert />
            <AlertTitle>Low credit balance</AlertTitle>
            <AlertDescription>
              Balance{" "}
              <strong className="text-destructive">
                {fmtMoney(cg.balance.credit_balance_cents, currency)}
              </strong>{" "}
              dropped below the {fmtMoney(lowThresholdCents, currency)} threshold.
              New activations may fail —{" "}
              <a href="/admin/billing">add credit</a>.
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : null}

      {/* ── Live CellGods stats ─────────────────────────────────────────── */}
      <Reveal delay={0.05}>
        <section className="mt-8">
          <SectionHeading
            title="Live CellGods data"
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
              <StatCard
                label="Credit balance"
                value={fmtMoney(cg.balance.credit_balance_cents, currency)}
                sub={
                  isLowCredit
                    ? "below threshold"
                    : cg.balance.auto_topup.enabled
                      ? "auto top-up on"
                      : undefined
                }
                icon={<Wallet />}
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
            aside={
              dbConfigured ? `${num(kpis.totalRentals)} rentals` : undefined
            }
          />
          {dbConfigured ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total revenue"
                value={fmtMoney(kpis.revenueCents, currency)}
                sub="active book"
                icon={<DollarSign />}
              />
              <StatCard
                label="Gross margin"
                value={fmtMoney(kpis.grossMarginCents, currency)}
                sub="retail − wholesale"
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
            <div className={cn("flex items-start gap-3 p-5", glassCard)}>
              <TriangleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-foreground">
                  The database is not configured
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add DATABASE_URL for revenue, margin, rentals, customers and
                  activity history.
                </p>
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {/* ── Revenue trend (sibling RevenueChart) ────────────────────────── */}
      {showRevenueChart ? (
        <Reveal delay={0.13}>
          <section className="mt-10">
            <SectionHeading
              title="Revenue"
              aside={`last ${num(REVENUE_DAYS)} days`}
            />
            <div className={cn("p-4 sm:p-6", glassCard)}>
              <RevenueChart data={revenue} currency={currency} />
            </div>
          </section>
        </Reveal>
      ) : null}

      {/* ── Recent orders + activity feed ───────────────────────────────── */}
      <Reveal delay={0.16}>
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Recent CellGods orders */}
          <div>
            <SectionHeading
              title="Recent orders"
              aside={cg ? `${num(cg.orders.length)} total` : undefined}
            />
            <div className={cn("overflow-hidden", glassCard)}>
              {!cg ? (
                <p className="p-6 text-sm text-muted-foreground">
                  {cgResult.ok ? "" : cgResult.message}
                </p>
              ) : recent.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No orders yet.
                </p>
              ) : (
                <ul className="divide-y divide-white/40">
                  {recent.map((order) => {
                    const item = byPhoneId.get(order.phone_id);
                    const badge = orderStatusBadge(order.status);
                    return (
                      <li
                        key={order.order_id}
                        className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                      >
                        <span aria-hidden="true" className={glassChip}>
                          <Smartphone />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {item?.model ?? order.phone_id}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {order.customer_email}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            Expires {fmtDate(order.expires_at)}
                          </span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Activity feed (audit log) */}
          <div>
            <SectionHeading
              title="Recent activity"
              aside={
                dbConfigured && logs.length > 0 ? `${num(logs.length)}` : undefined
              }
            />
            <div className={cn("overflow-hidden", glassCard)}>
              {!dbConfigured ? (
                <p className="p-6 text-sm text-muted-foreground">
                  A database connection is required for activity history.
                </p>
              ) : logs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="divide-y divide-white/40">
                  {logs.map((log) => {
                    const badge = actorTypeBadge(log.actorType);
                    const amount =
                      log.action === "admin.topup" ||
                      log.action === "admin.auto_topup"
                        ? metaNumber(log.metadata, "amount_cents")
                        : null;
                    return (
                      <li
                        key={log.id}
                        className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                      >
                        <span aria-hidden="true" className={glassChip}>
                          {logIcon(log.action)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {actionLabel(log.action)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {log.actorEmail ?? "system"}
                            {amount !== null
                              ? ` · ${fmtMoney(amount, currency)}`
                              : ""}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                          <span
                            className="hidden text-xs text-muted-foreground sm:inline"
                            title={fmtDate(log.createdAt.toISOString())}
                          >
                            {fmtRelative(log.createdAt)}
                          </span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
