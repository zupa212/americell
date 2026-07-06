import { Database } from "lucide-react";

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
import { AuroraText } from "@/components/ui/aurora-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Admin ORDERS page (RESELLER_PLAN §6.2) — owner-only, Server Component.
 *
 * Reads live CellGods orders directly through `lib/cellgods` (the API key never
 * reaches the client) and joins each `phone_id → model` from live inventory so
 * the table can show a human device name. `expires_at` is formatted HERE, on
 * the server, so the client table stays a pure presentational component with no
 * hydration-sensitive date math. The gate runs in `app/admin/layout.tsx`; we
 * re-assert it here as defence-in-depth (§6.1 — every layer re-checks).
 *
 * `force-dynamic`: order status/expiry are live and per-request; never cache.
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

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
    expiresLabel: fmtExpiry(o.expires_at),
  }));

  const showAlert = !configured || loadError;

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <AuroraText>Orders</AuroraText>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Active rentals on CellGods. Deactivating releases the device — with no
          refund.
        </p>
      </Reveal>

      {showAlert ? (
        <Reveal delay={0.05}>
          <Alert
            className={cn("border-white/50 bg-white/60 backdrop-blur-md")}
          >
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
        <Reveal delay={0.05}>
          <div className={cn("overflow-hidden", glassCard)}>
            <OrdersTable orders={rows} />
          </div>
        </Reveal>
      )}
    </div>
  );
}
