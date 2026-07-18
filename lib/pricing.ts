import "server-only";

import { eq } from "drizzle-orm";
import {
  getInventoryForBrowse,
  isCellgodsConfigured,
  type InventoryPhone,
  type Platform,
} from "@/lib/cellgods";
import { retailCentsFor, type PriceRounding } from "@/lib/money";
import { db, isDbConfigured } from "@/lib/db";
import { devicePriceOverrides, resellerSettings } from "@/db/schema";

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

/** The three rental durations, with English user-facing labels. `days` → CellGods `duration_days`. */
export const DURATIONS = [
  { period: "daily", days: 1, label: "Day" },
  { period: "weekly", days: 7, label: "Week" },
  { period: "monthly", days: 30, label: "Month" },
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
  availablePeriods: BillingPeriod[]; // durations CellGods actually prices for
};

/** Rental periods the device is actually priced for at CellGods (non-null wholesale). */
export function supportedPeriods(item: InventoryPhone): BillingPeriod[] {
  const out: BillingPeriod[] = [];
  if (item.price_daily != null) out.push("daily");
  if (item.price_weekly != null) out.push("weekly");
  if (item.price_monthly != null) out.push("monthly");
  return out;
}

/**
 * Which durations to OFFER for a device under flat pricing.
 *  - Pool devices are pre-paid: any duration is fulfillable via `duration_days`
 *    at $0 activation cost, so offer all three tiers (flat pricing derives
 *    daily/weekly from the monthly price). This is how daily gets enabled.
 *  - Shared devices only offer the tiers CellGods actually prices, so we never
 *    charge for a duration whose wholesale we can't verify.
 */
export function availablePeriodsFor(item: InventoryPhone): BillingPeriod[] {
  if (item.source === "pool") return ["daily", "weekly", "monthly"];
  return supportedPeriods(item);
}

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

export type MarginOpts = { pct: number; minCents: number; rounding: PriceRounding };

const SETTINGS_ID = "singleton";

function coerceRounding(raw: unknown): PriceRounding {
  return raw === "psychological" || raw === "none" || raw === "whole"
    ? raw
    : "whole";
}

/** Env-derived margin knobs — the fail-safe defaults (0 markup → sells at cost, never below). */
function envMarginOpts(): MarginOpts {
  const pct = Number(process.env.RESELLER_MARGIN_PCT);
  const minCents = Number(process.env.RESELLER_MARGIN_MIN_CENTS);
  return {
    pct: Number.isFinite(pct) ? pct : 0,
    minCents: Number.isFinite(minCents) ? minCents : 0,
    rounding: coerceRounding(process.env.RESELLER_PRICE_ROUNDING),
  };
}

/**
 * The LIVE margin knobs — the single source of truth for resale pricing, read by
 * BOTH the browse catalog and checkout so the shown price always equals the
 * charged price. Reads the admin-editable `reseller_settings` row; falls back to
 * the RESELLER_* env vars when the DB is unconfigured or the row is absent.
 */
export async function getMarginOpts(): Promise<MarginOpts> {
  if (!isDbConfigured) return envMarginOpts();
  try {
    const [row] = await db
      .select()
      .from(resellerSettings)
      .where(eq(resellerSettings.id, SETTINGS_ID))
      .limit(1);
    if (!row) return envMarginOpts();
    return {
      pct: row.marginPct,
      minCents: row.marginMinCents,
      rounding: coerceRounding(row.priceRounding),
    };
  } catch {
    return envMarginOpts();
  }
}

// ---- Flat per-platform pricing (fixed retail by device type) --------------

export type FlatPricing = {
  currency: string;
  monthly: Record<Platform, number>; // integer cents / month, by platform
};

/** Business default when no settings row exists: €150/mo Android, €250/mo iPhone. */
const DEFAULT_FLAT: FlatPricing = {
  currency: "eur",
  monthly: { android: 15000, iphone: 25000 },
};

/**
 * Derive daily/weekly/monthly tiers (integer cents) from a monthly price at a
 * constant per-day rate: daily = monthly/30 rounded to the nearest 50c,
 * weekly = 7 × daily, monthly as-is.
 */
export function deriveFlatTiers(monthlyCents: number): Record<BillingPeriod, number> {
  const daily = Math.max(0, Math.round(monthlyCents / 30 / 50) * 50);
  return { daily, weekly: daily * 7, monthly: Math.max(0, Math.round(monthlyCents)) };
}

/**
 * The LIVE flat-pricing config, or null when the reseller is in margin mode.
 * Read by BOTH browse and checkout so the shown price equals the charged price.
 * Defaults to flat (DEFAULT_FLAT) when the row is absent — fixed per-platform
 * pricing is the current business model.
 */
export async function getFlatPricing(): Promise<FlatPricing | null> {
  if (!isDbConfigured) return DEFAULT_FLAT;
  try {
    const [row] = await db
      .select()
      .from(resellerSettings)
      .where(eq(resellerSettings.id, SETTINGS_ID))
      .limit(1);
    if (!row) return DEFAULT_FLAT;
    if (row.pricingMode !== "flat") return null;
    return {
      currency: (row.flatCurrency || "eur").toLowerCase(),
      monthly: {
        android: row.flatAndroidMonthlyCents,
        iphone: row.flatIphoneMonthlyCents,
      },
    };
  } catch {
    return DEFAULT_FLAT;
  }
}

/** Raw flat-pricing settings for the admin UI (returns values even in margin mode). */
export async function getFlatPricingSettings(): Promise<{
  mode: "flat" | "margin";
  currency: string;
  androidMonthlyCents: number;
  iphoneMonthlyCents: number;
}> {
  const fallback = {
    mode: "flat" as const,
    currency: "eur",
    androidMonthlyCents: DEFAULT_FLAT.monthly.android,
    iphoneMonthlyCents: DEFAULT_FLAT.monthly.iphone,
  };
  if (!isDbConfigured) return fallback;
  try {
    const [row] = await db
      .select()
      .from(resellerSettings)
      .where(eq(resellerSettings.id, SETTINGS_ID))
      .limit(1);
    if (!row) return fallback;
    return {
      mode: row.pricingMode === "margin" ? "margin" : "flat",
      currency: row.flatCurrency || "eur",
      androidMonthlyCents: row.flatAndroidMonthlyCents,
      iphoneMonthlyCents: row.flatIphoneMonthlyCents,
    };
  } catch {
    return fallback;
  }
}

/** Client-safe retail for a phone under flat pricing (fixed by platform). */
export function flatRetailPhone(item: InventoryPhone, flat: FlatPricing): PublicRetailPhone {
  const monthly = flat.monthly[item.type] ?? DEFAULT_FLAT.monthly[item.type];
  return {
    phoneId: item.phone_id,
    model: item.model,
    platform: item.type,
    available: item.status === "available",
    currency: flat.currency,
    retail: deriveFlatTiers(monthly),
    availablePeriods: availablePeriodsFor(item),
  };
}

/**
 * THE single price resolver for every checkout path (Stripe / crypto / MoonPay).
 * Returns the retail (integer cents) + currency the SAME way the browse catalog
 * shows it (flat when active, else wholesale+margin), plus the wholesale and
 * whether the device actually offers this duration at CellGods. Every payment
 * route MUST use this so the shown price equals the charged price everywhere.
 */
export async function priceForCheckout(
  item: InventoryPhone,
  period: BillingPeriod,
): Promise<{
  retailCents: number;
  currency: string;
  wholesale: number;
  supported: boolean;
}> {
  const flat = await getFlatPricing();
  const pub = flat
    ? flatRetailPhone(item, flat)
    : toPublicRetailPhone(item, await getMarginOptsForPhone(item.phone_id));
  return {
    retailCents: pub.retail[period],
    currency: pub.currency.toLowerCase(),
    wholesale: wholesaleFor(item, period),
    // Offer the tier when the active pricing mode exposes it (pool devices get
    // all tiers under flat pricing; shared only their CellGods-priced tiers).
    supported: pub.availablePeriods.includes(period),
  };
}

/** Persist the flat-pricing config / mode (admin only, upserts the singleton). */
export async function updateFlatPricing(
  input: {
    mode: "flat" | "margin";
    currency: string;
    androidMonthlyCents: number;
    iphoneMonthlyCents: number;
  },
  updatedBy?: string,
): Promise<void> {
  await db
    .insert(resellerSettings)
    .values({
      id: SETTINGS_ID,
      marginPct: 0,
      marginMinCents: 0,
      pricingMode: input.mode,
      flatCurrency: input.currency.toLowerCase(),
      flatAndroidMonthlyCents: input.androidMonthlyCents,
      flatIphoneMonthlyCents: input.iphoneMonthlyCents,
      updatedBy: updatedBy ?? null,
    })
    .onConflictDoUpdate({
      target: resellerSettings.id,
      set: {
        pricingMode: input.mode,
        flatCurrency: input.currency.toLowerCase(),
        flatAndroidMonthlyCents: input.androidMonthlyCents,
        flatIphoneMonthlyCents: input.iphoneMonthlyCents,
        updatedAt: new Date(),
        updatedBy: updatedBy ?? null,
      },
    });
}

/** Persist the admin-set margin (upsert the singleton row). Server/admin only. */
export async function updateMarginSettings(
  input: { pct: number; minCents: number; rounding: PriceRounding },
  updatedBy?: string,
): Promise<void> {
  await db
    .insert(resellerSettings)
    .values({
      id: SETTINGS_ID,
      marginPct: input.pct,
      marginMinCents: input.minCents,
      priceRounding: input.rounding,
      updatedBy: updatedBy ?? null,
    })
    .onConflictDoUpdate({
      target: resellerSettings.id,
      set: {
        marginPct: input.pct,
        marginMinCents: input.minCents,
        priceRounding: input.rounding,
        updatedAt: new Date(),
        updatedBy: updatedBy ?? null,
      },
    });
}

/** Global opts with the device's markup swapped in when it has an override. */
export function resolveMarginOpts(
  global: MarginOpts,
  overridePct?: number,
): MarginOpts {
  return overridePct == null ? global : { ...global, pct: overridePct };
}

/** All per-device markup overrides as `{ [phoneId]: marginPct }`. Empty on any failure. */
export async function getDeviceOverrides(): Promise<Record<string, number>> {
  if (!isDbConfigured) return {};
  try {
    const rows = await db.select().from(devicePriceOverrides);
    return Object.fromEntries(rows.map((r) => [r.phoneId, r.marginPct]));
  } catch {
    return {};
  }
}

/**
 * The LIVE margin for ONE device — the global markup, overridden by that phone's
 * per-device markup when set. Used at checkout so a single device is priced the
 * same way it's shown.
 */
export async function getMarginOptsForPhone(phoneId: string): Promise<MarginOpts> {
  const global = await getMarginOpts();
  if (!isDbConfigured) return global;
  try {
    const [row] = await db
      .select()
      .from(devicePriceOverrides)
      .where(eq(devicePriceOverrides.phoneId, phoneId))
      .limit(1);
    return resolveMarginOpts(global, row?.marginPct);
  } catch {
    return global;
  }
}

/** Upsert a per-device markup override. Server/admin only. */
export async function setDeviceOverride(
  phoneId: string,
  marginPct: number,
  updatedBy?: string,
): Promise<void> {
  await db
    .insert(devicePriceOverrides)
    .values({ phoneId, marginPct, updatedBy: updatedBy ?? null })
    .onConflictDoUpdate({
      target: devicePriceOverrides.phoneId,
      set: { marginPct, updatedAt: new Date(), updatedBy: updatedBy ?? null },
    });
}

/** Remove a per-device override (the device falls back to the global markup). */
export async function clearDeviceOverride(phoneId: string): Promise<void> {
  await db.delete(devicePriceOverrides).where(eq(devicePriceOverrides.phoneId, phoneId));
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

/**
 * Map one inventory phone to its client-safe retail shape (strips all wholesale).
 * `opts` is the LIVE margin (from `getMarginOpts()`) — pass the SAME opts to the
 * browse map and to checkout so the shown price equals the charged price.
 */
export function toPublicRetailPhone(
  item: InventoryPhone,
  opts: MarginOpts,
): PublicRetailPhone {
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
    availablePeriods: supportedPeriods(item),
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
    // Flat mode: fixed retail per platform (ignores wholesale/margin/overrides).
    const flat = await getFlatPricing();
    if (flat) {
      const inventory = await getInventoryForBrowse();
      return { ok: true, phones: inventory.map((i) => flatRetailPhone(i, flat)) };
    }
    // Margin mode: retail = wholesale + margin (per-device override applied).
    // Cached browse read — the public catalog tolerates ~45s staleness in
    // exchange for an instant homepage. Checkout re-checks live availability.
    const [inventory, opts, overrides] = await Promise.all([
      getInventoryForBrowse(),
      getMarginOpts(),
      getDeviceOverrides(),
    ]);
    return {
      ok: true,
      phones: inventory.map((i) =>
        toPublicRetailPhone(i, resolveMarginOpts(opts, overrides[i.phone_id])),
      ),
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
