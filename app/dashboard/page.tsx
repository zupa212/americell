import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import type { Rental } from "@/db/schema";
import { listRentalsForUser, markExpired } from "@/lib/rentals";
import { DURATIONS, getRetailCatalog } from "@/lib/pricing";
import { isMoonpayConfigured } from "@/lib/moonpay";
import { isNowpaymentsConfigured } from "@/lib/nowpayments";
import { isCoinbaseConfigured } from "@/lib/coinbase";
import { isBtcpayConfigured } from "@/lib/btcpay";
import type { RentalCardData } from "@/components/rental-card";
import type { CryptoProvider } from "@/components/pricing-grid";
// The single client island. Its prop + row types are the shared contract — page
// and shell are compiler-locked to the same shape by importing them from here.
import DashboardShell, {
  type BillingRow,
} from "@/components/dashboard-shell";

// → "Americell · Dashboard" via the brand-first title template.
export const metadata = { title: "Dashboard" };

// Statuses that entitle a live rental (§5.4: `pooled` is active-equivalent).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/**
 * Crypto payment options offered in the in-dashboard "Pay with crypto" picker.
 * `configured` is read from the SERVER-ONLY provider flags (env), so the client
 * only learns which options exist — never any keys. Identical to the landing
 * `pricing.tsx` helper so both checkout surfaces stay in lockstep.
 */
function cryptoProviders(): CryptoProvider[] {
  return [
    { id: "nowpayments", label: "Crypto (no sign-up)", note: "100+ coins · no KYC", noKyc: true, configured: isNowpaymentsConfigured },
    { id: "btcpay", label: "Bitcoin & Lightning", note: "Self-custody · no KYC", noKyc: true, configured: isBtcpayConfigured },
    { id: "coinbase", label: "Coinbase Commerce", note: "Pay from any wallet · no KYC", noKyc: true, configured: isCoinbaseConfigured },
    { id: "moonpay", label: "MoonPay", note: "Card or bank → crypto", noKyc: false, configured: isMoonpayConfigured },
  ];
}

/**
 * Project a full `Rental` row down to the client-safe shape RentalCard needs.
 *
 * CRITICAL (§7.4): `streamUrl` and `pinCiphertext` are NEVER included — those
 * secrets are served only from the ownership-checked `/access` and `/pin`
 * routes, never serialized into the dashboard HTML/RSC payload. Also strips
 * reseller margin data (`wholesaleQuotedCents` / `chargedCents`) and internal
 * payment ids. Timestamps become ISO strings for a clean server→client boundary.
 */
function toCardData(r: Rental): RentalCardData {
  return {
    id: r.id,
    phoneId: r.phoneId,
    model: r.model,
    platform: r.platform,
    billingPeriod: r.billingPeriod,
    durationDays: r.durationDays,
    retailCents: r.retailCents,
    status: r.status,
    streamMintedAt: r.streamMintedAt ? r.streamMintedAt.toISOString() : null,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Project a full `Rental` into a billing/receipt row for the Billing & Account
 * section. Payments are one-time Stripe (mode:payment), so each rental IS its
 * own receipt — we do NOT call the Stripe Invoices API.
 *
 * Mirrors `toCardData`'s secret-stripping: only client-safe fields cross the
 * boundary, and the amount is `retailCents` (what the customer paid) — the
 * reseller margin (`wholesaleQuotedCents` / `chargedCents`) NEVER reaches the
 * client. Applied to the FULL rental list so it stays independent of the
 * active/history split and inherits `listRentalsForUser`'s newest-first order.
 */
function toBillingRow(r: Rental): BillingRow {
  return {
    id: r.id,
    model: r.model,
    platform: r.platform,
    billingPeriod: r.billingPeriod,
    amountCents: r.retailCents,
    currency: "usd",
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let rows: Rental[] = [];
  let dbError = false;
  if (isDbConfigured) {
    try {
      rows = await listRentalsForUser(session.user.id);

      // Lazy expiry (§5.5 D): flip any live rental whose expiry has passed. The
      // decision lives in SQL — `markExpired` is a guarded CAS
      // (WHERE status='active' AND expiresAt < now()), so firing it on every
      // active rental only flips the truly-expired ones (the rest match 0 rows).
      // We then re-read to reflect any flips, keeping this Server Component pure
      // (no wall-clock read during render).
      const live = rows.filter(
        (r) => r.status === "active" && r.expiresAt != null,
      );
      if (live.length > 0) {
        await Promise.all(live.map((r) => markExpired(r.id)));
        rows = await listRentalsForUser(session.user.id);
      }
    } catch {
      dbError = true;
    }
  }

  // Partition into Active (entitled) vs History (everything else). `rows` is
  // already ordered desc(createdAt), so both lists come out newest-first.
  const active: RentalCardData[] = [];
  const history: RentalCardData[] = [];
  for (const r of rows) {
    (ACTIVE_STATUSES.has(r.status) ? active : history).push(toCardData(r));
  }

  // Purchase history (receipts) — projected from the FULL list, newest-first.
  const billing = rows.map(toBillingRow);

  const email = session.user.email ?? "";
  const dbConnected = isDbConfigured && !dbError;

  // Live retail catalog for the in-dashboard rent panel. Fails closed on the
  // server (never fetched on the client) so the page stays a pure Server
  // Component with the shell as its single client island.
  const catalog = await getRetailCatalog();

  // One Suspense boundary covers BOTH the shell's `?tab` sync read and the
  // nested <CheckoutSuccess/> — both call useSearchParams.
  return (
    <Suspense fallback={null}>
      <DashboardShell
        email={email}
        activeCount={active.length}
        rentals={{ active, history }}
        store={
          catalog.ok
            ? {
                ok: true,
                phones: catalog.phones,
                durations: DURATIONS,
                cryptoProviders: cryptoProviders(),
              }
            : { ok: false, reason: catalog.reason }
        }
        billing={billing}
        dbConnected={dbConnected}
      />
    </Suspense>
  );
}
