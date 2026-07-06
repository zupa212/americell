import { Clock3, Database, Radio, ShoppingBag, Users } from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import {
  getInventory,
  getOrders,
  isCellgodsConfigured,
  type InventoryPhone,
  type Order,
} from "@/lib/cellgods";
import OrdersTable, {
  type AdminOrderRow,
} from "@/components/admin/orders-table";
import { StatCard } from "@/components/admin/stat-card";
import { AuroraText } from "@/components/ui/aurora-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LottiePlayer from "@/components/ui/lottie";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Admin ORDERS page (RESELLER_PLAN §6.2) — owner-only, Server Component.
 *
 * Reads live CellGods orders directly through `lib/cellgods` (the API key never
 * reaches the client) and joins each `phone_id → model` from live inventory so
 * the table can show a human device name. `expires_at` is BOTH preformatted here
 * on the server (deterministic locale/timezone label, hydration-safe) AND passed
 * through raw (ISO) so the client table can render a live relative countdown
 * behind a mount-gated clock. The gate runs in `app/admin/layout.tsx`; we
 * re-assert it here as defence-in-depth (§6.1 — every layer re-checks).
 *
 * `force-dynamic`: order status/expiry are live and per-request; never cache.
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// CellGods statuses that entitle a live order (§5.4: `pooled` ≈ active).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);
const DAY_MS = 86_400_000;

// Deterministic server-side expiry formatting (fixed locale + timezone) so the
// preformatted label can't drift between server render and client hydration.
const expiryFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

function fmtExpiry(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return expiryFmt.format(d);
}

/**
 * Server-only order metrics. `Date.now()` lives here (module scope), not in the
 * component body, so it's evaluated once per request as pure server work — the
 * counts are baked into the server HTML and never recomputed on the client.
 */
function computeMetrics(rows: AdminOrderRow[]): {
  liveCount: number;
  expiringSoon: number;
  customerCount: number;
} {
  const now = Date.now();
  let liveCount = 0;
  let expiringSoon = 0;
  const customers = new Set<string>();
  for (const r of rows) {
    customers.add(r.customer_email);
    if (!ACTIVE_STATUSES.has(r.status)) continue;
    liveCount += 1;
    if (!r.expiresAt) continue;
    const delta = new Date(r.expiresAt).getTime() - now;
    if (delta > 0 && delta <= DAY_MS) expiringSoon += 1;
  }
  return { liveCount, expiringSoon, customerCount: customers.size };
}

export default async function AdminOrdersPage() {
  await requireAdminPage();

  let orders: Order[] = [];
  const modelById = new Map<string, string>();
  let loadError = false;
  const configured = isCellgodsConfigured;

  if (configured) {
    try {
      // Orders are the payload; inventory is a best-effort enrichment — a failed
      // inventory read degrades to showing `phone_id`, it never blanks the page.
      const [ordersRes, inventoryRes] = await Promise.all([
        getOrders(),
        getInventory().catch(() => [] as InventoryPhone[]),
      ]);
      orders = ordersRes;
      for (const p of inventoryRes) modelById.set(p.phone_id, p.model);
    } catch {
      loadError = true;
    }
  }

  const rows: AdminOrderRow[] = orders.map((o) => ({
    order_id: o.order_id,
    phone_id: o.phone_id,
    model: modelById.get(o.phone_id) ?? null,
    customer_email: o.customer_email,
    status: o.status,
    // Raw ISO for the client's live relative countdown…
    expiresAt: o.expires_at || null,
    // …plus a deterministic absolute label used verbatim before hydration.
    expiresLabel: fmtExpiry(o.expires_at),
  }));

  // Server-computed metrics — baked into the server HTML (no client recompute).
  const { liveCount, expiringSoon, customerCount } = computeMetrics(rows);

  const showAlert = !configured || loadError;

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <AuroraText>Orders</AuroraText>
            </h1>
            <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
              Active rentals on CellGods. Deactivating releases the device — with
              no refund.
            </p>
          </div>

          {/* Live indicator: this surface reflects live CellGods state. */}
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 py-1.5 pr-3 pl-1.5 text-xs font-medium text-foreground backdrop-blur-md",
            )}
          >
            <LottiePlayer src="/lottie/pulse.json" className="h-6 w-6" />
            <span className="tabular-nums">
              {liveCount} live now
            </span>
          </span>
        </div>
      </Reveal>

      {!showAlert ? (
        <Reveal delay={0.04}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Total orders"
              value={rows.length.toLocaleString("en-US")}
              sub="Across all statuses"
              icon={<ShoppingBag />}
            />
            <StatCard
              label="Live rentals"
              value={liveCount.toLocaleString("en-US")}
              sub="Active or pooled"
              icon={<Radio />}
            />
            <StatCard
              label="Expiring < 24h"
              value={expiringSoon.toLocaleString("en-US")}
              sub="Live orders ending soon"
              icon={<Clock3 />}
            />
            <StatCard
              label="Customers"
              value={customerCount.toLocaleString("en-US")}
              sub="Unique renters"
              icon={<Users />}
            />
          </div>
        </Reveal>
      ) : null}

      {showAlert ? (
        <Reveal delay={0.05}>
          <Alert className={cn("border-white/50 bg-white/60 backdrop-blur-md")}>
            <Database className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>
              {configured
                ? "Couldn't load orders."
                : "CellGods isn't configured yet."}
            </AlertTitle>
            <AlertDescription>
              {configured ? (
                <>Try again shortly or check the API key.</>
              ) : (
                <>
                  Add <code>CELLGODS_API_KEY</code> to the environment to show
                  orders here.
                </>
              )}
            </AlertDescription>
          </Alert>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <div className={cn("overflow-hidden", glassCard)}>
            <OrdersTable orders={rows} />
          </div>
        </Reveal>
      )}
    </div>
  );
}
