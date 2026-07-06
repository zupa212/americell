import "server-only";

import {
  getInventory,
  isCellgodsConfigured,
  type InventoryPhone,
  type Platform,
} from "@/lib/cellgods";
import { retailCentsFor, type PriceRounding } from "@/lib/money";

/**
 * Retail catalog + pricing — SERVER ONLY.
 *
 * Turns CellGods wholesale inventory into a client-safe retail catalog. The
 * reseller margin (`RESELLER_MARGIN_PCT` / `RESELLER_MARGIN_MIN_CENTS` /
 * `RESELLER_PRICE_ROUNDING`) is read here, on the server, and applied via the
 * pure `retailCentsFor` from `@/lib/money`. Wholesale cost NEVER crosses to the
 * client: only `PublicRetailPhone` (retail cents per period) leaves this module.
 *
 * Money is ALWAYS integer cents.
 */

export type BillingPeriod = "daily" | "weekly" | "monthly";

/** The three rental durations, with Greek user-facing labels. `days` → CellGods `duration_days`. */
export const DURATIONS = [
  { period: "daily", days: 1, labelEl: "Ημέρα" },
  { period: "weekly", days: 7, labelEl: "Εβδομάδα" },
  { period: "monthly", days: 30, labelEl: "Μήνας" },
] as const;

/**
 * What crosses to the client. Deliberately carries NO wholesale cost and NO
 * margin — only the computed retail price (integer cents) per period.
 */
export type PublicRetailPhone = {
  phoneId: string;
  model: string;
  platform: Platform; // "android" | "iphone"
  available: boolean;
  currency: string;
  retail: Record<BillingPeriod, number>; // cents
};

/**
 * Wholesale cost (integer cents) for a phone at a given period. Returns 0 when
 * that tier is unpriced (`price_*` null) — retailCentsFor still floors at >= 0,
 * and checkout enforces availability/credit before charging.
 */
export function wholesaleFor(item: InventoryPhone, period: BillingPeriod): number {
  const cents =
    period === "daily"
      ? item.price_daily
      : period === "weekly"
        ? item.price_weekly
        : item.price_monthly;
  return cents ?? 0;
}

type MarginOpts = { pct: number; minCents: number; rounding: PriceRounding };

/** Server-only margin knobs, read from env with fail-safe defaults (0 markup → sells at cost, never below). */
function marginOpts(): MarginOpts {
  const pct = Number(process.env.RESELLER_MARGIN_PCT);
  const minCents = Number(process.env.RESELLER_MARGIN_MIN_CENTS);
  const roundingRaw = process.env.RESELLER_PRICE_ROUNDING;
  const rounding: PriceRounding =
    roundingRaw === "psychological" || roundingRaw === "none" || roundingRaw === "whole"
      ? roundingRaw
      : "whole";
  return {
    pct: Number.isFinite(pct) ? pct : 0,
    minCents: Number.isFinite(minCents) ? minCents : 0,
    rounding,
  };
}

/** Provider-suggested retail (cents) for a tier, or null when not supplied. */
function suggestedFor(item: InventoryPhone, period: BillingPeriod): number | null {
  const s = item.suggested_retail;
  if (!s) return null;
  return period === "daily" ? s.daily : period === "weekly" ? s.weekly : s.monthly;
}

/**
 * Retail (integer cents) for one tier: prefer `suggested_retail.<period>` when
 * present, otherwise compute from wholesale via `retailCentsFor`. Clamped to
 * `>= wholesale` so the "never below wholesale" invariant holds even on odd data.
 */
function retailForTier(item: InventoryPhone, period: BillingPeriod, opts: MarginOpts): number {
  const wholesale = wholesaleFor(item, period);
  const suggested = suggestedFor(item, period);
  if (suggested != null) return Math.max(suggested, wholesale);
  return retailCentsFor(wholesale, opts);
}

/** Map one inventory phone to its client-safe retail shape (strips all wholesale). */
export function toPublicRetailPhone(item: InventoryPhone): PublicRetailPhone {
  const opts = marginOpts();
  const retail = {
    daily: retailForTier(item, "daily", opts),
    weekly: retailForTier(item, "weekly", opts),
    monthly: retailForTier(item, "monthly", opts),
  } satisfies Record<BillingPeriod, number>;
  return {
    phoneId: item.phone_id,
    model: item.model,
    platform: item.type,
    available: item.status === "available",
    currency: item.currency,
    retail,
  };
}

/**
 * Live retail catalog for the browse page. Fails closed:
 *  - `{ ok:false, reason:"unconfigured" }` when the CellGods key is unset (demo mode).
 *  - `{ ok:false, reason:"error" }` on any inventory fetch/parse failure.
 */
export async function getRetailCatalog(): Promise<
  | { ok: true; phones: PublicRetailPhone[] }
  | { ok: false; reason: "unconfigured" | "error" }
> {
  if (!isCellgodsConfigured) return { ok: false, reason: "unconfigured" };
  try {
    const inventory = await getInventory();
    return { ok: true, phones: inventory.map(toPublicRetailPhone) };
  } catch {
    return { ok: false, reason: "error" };
  }
}
