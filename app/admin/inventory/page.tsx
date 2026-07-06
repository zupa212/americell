import { requireAdminPage } from "@/lib/admin";
import {
  getInventory,
  isCellgodsConfigured,
  type InventoryPhone,
} from "@/lib/cellgods";
import { DURATIONS, toPublicRetailPhone } from "@/lib/pricing";
import InventoryTable, {
  type InventoryRow,
} from "@/components/admin/inventory-table";
import { AuroraText } from "@/components/ui/aurora-text";
import Reveal from "@/components/ui/reveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Frosted-glass surface — floats over the global aurora (SiteBackground).
const GLASS =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

/** Project a raw inventory phone to the admin table row (retail estimate = checkout math). */
function toRow(p: InventoryPhone): InventoryRow {
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
      ? toPublicRetailPhone(p).retail.monthly
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
      const inventory = await getInventory();
      rows = inventory.map(toRow);
    } catch {
      state = "error";
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Πίνακας διαχείρισης
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          <AuroraText>Απόθεμα</AuroraText>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ζωντανό απόθεμα CellGods με χονδρική τιμή και εκτιμώμενη λιανική.
          Ενεργοποίησε μια διαθέσιμη συσκευή για έναν πελάτη.
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-10">
        {state === "unconfigured" ? (
          <Alert>
            <AlertTitle>Λειτουργία demo</AlertTitle>
            <AlertDescription>
              Το CellGods API δεν έχει ρυθμιστεί ακόμα, οπότε δεν υπάρχει ζωντανό
              απόθεμα να εμφανιστεί.
            </AlertDescription>
          </Alert>
        ) : state === "error" ? (
          <Alert variant="destructive">
            <AlertTitle>Σφάλμα φόρτωσης</AlertTitle>
            <AlertDescription>
              Δεν ήταν δυνατή η φόρτωση του αποθέματος. Ανανέωσε τη σελίδα και
              δοκίμασε ξανά.
            </AlertDescription>
          </Alert>
        ) : (
          <div className={cn(GLASS, "p-1.5 sm:p-2")}>
            <InventoryTable rows={rows} durations={DURATIONS} />
          </div>
        )}
      </Reveal>
    </main>
  );
}
