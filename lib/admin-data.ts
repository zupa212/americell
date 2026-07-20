import "server-only";

import { desc, eq, gte, sql } from "drizzle-orm";

import { rentals, users } from "@/db/schema";
import { db, isDbConfigured } from "@/lib/db";
import { rentalRef } from "@/lib/rental-ref";

/**
 * Server-only READ helpers for the AMERICELL admin panel (RESELLER_PLAN §6).
 *
 * Every export is a pure read over the Drizzle/Postgres store, guarded by
 * `isDbConfigured` so the app builds and boots before a database exists: when
 * unconfigured each helper returns a **safe empty default** (zeros / `[]`)
 * instead of touching the throwing DB proxy.
 *
 * Money is ALWAYS integer cents. postgres.js returns SQL aggregates
 * (`count`/`sum`, which are bigint/numeric) as **strings**, so every aggregated
 * scalar is run through `toInt` before it leaves this module — the callers get
 * real `number`s, never a stringly-typed surprise. Plain `integer` columns
 * (`retailCents`, `chargedCents`) already arrive as JS numbers.
 *
 * Two intentionally-different notions of "revenue" live here — see each helper:
 *  - `adminKpis().revenueCents` = the CURRENT live book (active/pooled only).
 *  - `revenueByDay()`           = BOOKED revenue over time (everything captured
 *                                 and kept, bucketed by the day it was created).
 */

/** Coerce an unknown SQL scalar (often a bigint/numeric string) to a finite int. */
function toInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export type AdminKpis = {
  totalRentals: number;
  activeRentals: number;
  expiredRentals: number;
  /** Live book: Σ retailCents over rentals currently `active`/`pooled`. */
  revenueCents: number;
  /** Σ (retailCents − chargedCents) over rentals with a known wholesale charge. */
  grossMarginCents: number;
  customersCount: number;
};

/**
 * Headline numbers for the admin dashboard. Two conditional-aggregate scans
 * (rentals, users) run in parallel — no per-row round trips.
 */
export async function adminKpis(): Promise<AdminKpis> {
  if (!isDbConfigured) {
    return {
      totalRentals: 0,
      activeRentals: 0,
      expiredRentals: 0,
      revenueCents: 0,
      grossMarginCents: 0,
      customersCount: 0,
    };
  }

  const [rentalAgg, userAgg] = await Promise.all([
    db
      .select({
        totalRentals: sql<number>`count(*)`,
        activeRentals: sql<number>`count(*) filter (where ${rentals.status} = 'active')`,
        expiredRentals: sql<number>`count(*) filter (where ${rentals.status} = 'expired')`,
        revenueCents: sql<number>`coalesce(sum(${rentals.retailCents}) filter (where ${rentals.status} in ('active', 'pooled')), 0)`,
        grossMarginCents: sql<number>`coalesce(sum(${rentals.retailCents} - ${rentals.chargedCents}) filter (where ${rentals.chargedCents} is not null), 0)`,
      })
      .from(rentals),
    db.select({ customersCount: sql<number>`count(*)` }).from(users),
  ]);

  return {
    totalRentals: toInt(rentalAgg[0]?.totalRentals),
    activeRentals: toInt(rentalAgg[0]?.activeRentals),
    expiredRentals: toInt(rentalAgg[0]?.expiredRentals),
    revenueCents: toInt(rentalAgg[0]?.revenueCents),
    grossMarginCents: toInt(rentalAgg[0]?.grossMarginCents),
    customersCount: toInt(userAgg[0]?.customersCount),
  };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type CustomerRow = {
  id: string;
  email: string;
  createdAt: Date;
  /** Rows in `rentals` for this user (includes abandoned/pending checkouts). */
  rentalsCount: number;
  /** Σ retailCents of rentals actually charged & kept (excludes pending/refunded). */
  totalSpentCents: number;
};

/**
 * One row per user, LEFT-joined to their rentals and grouped — so a customer
 * with zero (or only pending) rentals still appears, with `rentalsCount` /
 * `totalSpentCents` of 0. Ordered by spend desc (top customers first), then
 * newest signup.
 *
 * `totalSpentCents` counts only rentals whose payment was captured and NOT
 * refunded — `pending_payment` was never charged and `refunded` was returned;
 * every other state (paid / activating / activation_pending_credit / active /
 * pooled / deactivated / expired) reflects money the customer actually spent.
 */
export async function listCustomers(): Promise<CustomerRow[]> {
  if (!isDbConfigured) return [];

  const totalSpent = sql<number>`coalesce(sum(${rentals.retailCents}) filter (where ${rentals.status} not in ('pending_payment', 'refunded')), 0)`;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      rentalsCount: sql<number>`count(${rentals.id})`,
      totalSpentCents: totalSpent,
    })
    .from(users)
    .leftJoin(rentals, eq(rentals.userId, users.id))
    .groupBy(users.id, users.email, users.createdAt)
    .orderBy(desc(totalSpent), desc(users.createdAt));

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    createdAt: r.createdAt,
    rentalsCount: toInt(r.rentalsCount),
    totalSpentCents: toInt(r.totalSpentCents),
  }));
}

// ---------------------------------------------------------------------------
// Rentals table
// ---------------------------------------------------------------------------

export type AdminRentalRow = {
  id: string;
  /** Human-readable order reference (AMC-XXXXXXXX) — matches the Stripe receipt. */
  transactionRef: string;
  model: string;
  platform: string;
  customerEmail: string;
  status: string;
  retailCents: number;
  /** Actual wholesale charged by CellGods; `null` until activation succeeds. */
  chargedCents: number | null;
  /** retailCents − chargedCents, or `null` while the wholesale is still unknown. */
  marginCents: number | null;
  billingPeriod: string;
  createdAt: Date;
  expiresAt: Date | null;
  /** How the customer paid, derived from the session id (Card / NOWPayments / …). */
  paymentMethod: string;
};

/** Human label for how a rental was paid, from the bound session-id prefix. */
export function paymentMethodLabel(sessionId: string): string {
  if (sessionId.startsWith("cs_")) return "Card";
  if (sessionId.startsWith("nowpayments_")) return "NOWPayments";
  if (sessionId.startsWith("moonpay_")) return "MoonPay";
  if (sessionId.startsWith("coinbase_")) return "Coinbase";
  if (sessionId.startsWith("btcpay_")) return "BTCPay";
  if (sessionId.startsWith("manual_")) return "Manual";
  if (sessionId.startsWith("pending_")) return "Unpaid";
  return "—";
}

/**
 * Newest rentals first for the admin rentals table. `limit` is clamped to a
 * sane range. `marginCents` is derived per-row (only when `chargedCents` is
 * known — otherwise `null`, never a bogus `retailCents - 0`).
 */
export async function listAllRentals(limit = 200): Promise<AdminRentalRow[]> {
  if (!isDbConfigured) return [];

  const capped = Math.min(Math.max(Math.trunc(limit), 1), 1000);

  const rows = await db
    .select({
      id: rentals.id,
      model: rentals.model,
      platform: rentals.platform,
      customerEmail: rentals.customerEmail,
      status: rentals.status,
      retailCents: rentals.retailCents,
      chargedCents: rentals.chargedCents,
      billingPeriod: rentals.billingPeriod,
      createdAt: rentals.createdAt,
      expiresAt: rentals.expiresAt,
      stripeSessionId: rentals.stripeSessionId,
    })
    .from(rentals)
    .orderBy(desc(rentals.createdAt))
    .limit(capped);

  return rows.map(({ stripeSessionId, ...r }) => ({
    ...r,
    transactionRef: rentalRef(r.id),
    marginCents: r.chargedCents === null ? null : r.retailCents - r.chargedCents,
    paymentMethod: paymentMethodLabel(stripeSessionId),
  }));
}

// ---------------------------------------------------------------------------
// Revenue timeseries (chart)
// ---------------------------------------------------------------------------

export type RevenuePoint = {
  /** UTC calendar day, `YYYY-MM-DD`. */
  day: string;
  revenueCents: number;
};

/**
 * Booked revenue for the last `days` UTC days, oldest → newest, as a
 * **contiguous, zero-filled** series (every day in the window is present so the
 * chart has no gaps). Only the windowed rows are fetched, then bucketed in JS
 * by their UTC creation day.
 *
 * "Booked" here = everything captured and kept (excludes `pending_payment`,
 * which was never charged, and `refunded`, which was returned). This is a
 * historical trend and so deliberately differs from `adminKpis().revenueCents`,
 * which is only the *currently live* book.
 */
export async function revenueByDay(days = 14): Promise<RevenuePoint[]> {
  if (!isDbConfigured) return [];

  const span = Math.min(Math.max(Math.trunc(days), 1), 365);

  // Window start: 00:00:00 UTC, (span - 1) days ago → `span` contiguous buckets
  // ending on today (UTC).
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (span - 1));

  const rows = await db
    .select({
      createdAt: rentals.createdAt,
      retailCents: rentals.retailCents,
      status: rentals.status,
    })
    .from(rentals)
    .where(gte(rentals.createdAt, start));

  const byDay = new Map<string, number>();
  for (const r of rows) {
    if (r.status === "pending_payment" || r.status === "refunded") continue;
    const day = r.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + toInt(r.retailCents));
  }

  const series: RevenuePoint[] = [];
  for (let i = 0; i < span; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const day = d.toISOString().slice(0, 10);
    series.push({ day, revenueCents: byDay.get(day) ?? 0 });
  }
  return series;
}
