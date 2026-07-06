import {
  ClipboardList,
  Smartphone,
  TrendingUp,
  TriangleAlert,
  Wallet,
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
import { StatCard } from "@/components/admin/stat-card";
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// This cockpit reads live CellGods data on every request — never prerender it.
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// CellGods order statuses that count as a live rental (§5.4: `pooled` ≈ active).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/** How many orders to surface in the "recent" list. */
const RECENT_LIMIT = 8;

/**
 * Greek message for a CellGods HTTP status (the §6.2 status map). Anything
 * unmapped (incl. status 0 network/timeout) falls back to the 500 copy.
 */
function greekForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Μη έγκυρο αίτημα";
    case 401:
      return "Λείπει το κλειδί API";
    case 402:
      return "Ανεπαρκές υπόλοιπο — πρόσθεσε πίστωση";
    case 403:
      return "Μη έγκυρο κλειδί API";
    case 404:
      return "Δεν βρέθηκε";
    case 409:
      return "Η συσκευή δεν είναι πλέον διαθέσιμη";
    case 429:
      return "Πολλά αιτήματα";
    default:
      return "Σφάλμα διακομιστή";
  }
}

/** Order status → Greek label + Badge variant. */
function orderStatusBadge(status: string): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  switch (status) {
    case "active":
    case "pooled":
      return { label: "ενεργή", variant: "default" };
    case "expired":
      return { label: "έληξε", variant: "outline" };
    case "deactivated":
      return { label: "ακυρωμένη", variant: "outline" };
    default:
      return { label: status, variant: "secondary" };
  }
}

/** Format an ISO timestamp for el-GR display (server-rendered, no hydration). */
function fmtDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Intl.DateTimeFormat("el-GR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(t);
}

type OverviewData = {
  balance: Balance;
  orders: Order[];
  inventory: InventoryPhone[];
};

/**
 * Fetch the three overview reads in parallel, failing closed to a Greek notice.
 * Never throws: unconfigured → setup hint; `CellgodsError` → mapped Greek copy.
 */
async function loadOverview(): Promise<
  { ok: true; data: OverviewData } | { ok: false; message: string }
> {
  if (!isCellgodsConfigured) {
    return {
      ok: false,
      message:
        "Το CellGods API δεν έχει ρυθμιστεί. Πρόσθεσε το CELLGODS_API_KEY για ζωντανά δεδομένα.",
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
      return { ok: false, message: greekForStatus(err.status) };
    }
    return { ok: false, message: "Σφάλμα διακομιστή" };
  }
}

function OverviewHeader() {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        Πίνακας διαχείρισης
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
        <AuroraText>Επισκόπηση</AuroraText>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Ζωντανή εικόνα πίστωσης, ενεργών ενοικιάσεων και διαθέσιμων συσκευών.
      </p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const result = await loadOverview();

  if (!result.ok) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <OverviewHeader />
        <div className={cn("mt-8 flex items-start gap-3 p-5", glassCard)}>
          <TriangleAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-foreground">
              Δεν ήταν δυνατή η φόρτωση των δεδομένων
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const { balance, orders, inventory } = result.data;

  // Index inventory by phone_id for the margin join + recent-order model lookup.
  const byPhoneId = new Map(inventory.map((p) => [p.phone_id, p]));

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.status));
  const availableCount = inventory.filter(
    (p) => p.status === "available",
  ).length;

  // §6.2 margin ESTIMATE — join active orders → inventory and approximate each as
  // a monthly rental. retail = suggested_retail.monthly ?? retailCentsFor(
  // price_monthly, …); we reuse `toPublicRetailPhone` so this is the exact SAME
  // pricing path as checkout. wholesale = price_monthly. margin = Σretail − Σwholesale.
  // Orders with no live inventory match can't be priced, so they're skipped.
  let retailSum = 0;
  let wholesaleSum = 0;
  for (const order of activeOrders) {
    const item = byPhoneId.get(order.phone_id);
    if (!item) continue;
    retailSum += toPublicRetailPhone(item).retail.monthly;
    wholesaleSum += item.price_monthly ?? 0;
  }
  const marginCents = retailSum - wholesaleSum;

  const currency = balance.currency || "usd";

  // "Recent" proxy: CellGods orders carry no created_at, so order by expiry
  // (latest-expiring ≈ most-recently activated) and take the top N.
  const recent = [...orders]
    .sort((a, b) => Date.parse(b.expires_at) - Date.parse(a.expires_at))
    .slice(0, RECENT_LIMIT);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Reveal>
        <OverviewHeader />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Υπόλοιπο πίστωσης"
            value={fmtMoney(balance.credit_balance_cents, currency)}
            sub={
              balance.auto_topup.enabled
                ? "Αυτόματη ανανέωση: ενεργή"
                : undefined
            }
            icon={<Wallet />}
          />
          <StatCard
            label="Ενεργές παραγγελίες"
            value={activeOrders.length.toLocaleString("el-GR")}
            sub={`${orders.length.toLocaleString("el-GR")} συνολικά`}
            icon={<ClipboardList />}
          />
          <StatCard
            label="Διαθέσιμες συσκευές"
            value={availableCount.toLocaleString("el-GR")}
            sub={`${inventory.length.toLocaleString("el-GR")} στο απόθεμα`}
            icon={<Smartphone />}
          />
          <StatCard
            label="Εκτιμώμενο περιθώριο"
            value={fmtMoney(marginCents, currency)}
            sub="εκτίμηση / μήνα"
            icon={<TrendingUp />}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Πρόσφατες παραγγελίες
            </h2>
            <span className="text-sm text-muted-foreground">
              {orders.length.toLocaleString("el-GR")} συνολικά
            </span>
          </div>

          <div className={cn("overflow-hidden", glassCard)}>
            {recent.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Δεν υπάρχουν παραγγελίες ακόμη.
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
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand backdrop-blur-md"
                      >
                        <Smartphone className="h-4 w-4" />
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
                          Λήγει {fmtDate(order.expires_at)}
                        </span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
