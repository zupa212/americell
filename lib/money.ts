/**
 * Retail money math — PURE and client-safe.
 *
 * Deliberately NO `import "server-only"` and NO `process.env` reads: the client
 * needs `fmtMoney` for display, and `retailCentsFor` takes its pricing knobs as
 * arguments so the server (which owns `RESELLER_MARGIN_PCT` / `MIN_CENTS` /
 * `ROUNDING`) can pass them in without dragging env into the browser bundle.
 *
 * Money is ALWAYS integer cents. Every function here operates on and returns
 * integer cents; formatting to a locale string is the only place we divide.
 */

/** Rounding strategies applied on top of the marked-up wholesale price. */
export type PriceRounding = "whole" | "psychological" | "none";

/**
 * Format integer cents as a localized currency string (el-GR, e.g. "80,00 $").
 * `currency` is an ISO-4217 code, case-insensitive (default "usd").
 */
export function fmtMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Compute the retail price (integer cents) for a wholesale price.
 *
 *   base = max( ceil(w * (1 + pct/100)),  w + minCents,  w )
 *
 * then `rounding` is applied to `base`. The result is NEVER below `wholesaleCents`
 * — this is the core money-safety invariant (`retailCents >= wholesale`).
 *
 * Rounding modes (all round UP so the invariant always holds):
 *  - "whole":         round up to the next whole currency unit (…00).
 *  - "psychological": round up to the next value ending in …99.
 *  - "none":          leave `base` as-is.
 */
export function retailCentsFor(
  wholesaleCents: number,
  opts: { pct: number; minCents: number; rounding?: PriceRounding },
): number {
  const { pct, minCents, rounding = "whole" } = opts;

  const marked = Math.ceil(wholesaleCents * (1 + pct / 100));
  const base = Math.max(marked, wholesaleCents + minCents, wholesaleCents);

  let retail: number;
  switch (rounding) {
    case "whole":
      retail = Math.ceil(base / 100) * 100;
      break;
    case "psychological":
      // Smallest value >= base whose cents component is 99.
      retail = Math.ceil((base + 1) / 100) * 100 - 1;
      break;
    case "none":
    default:
      retail = base;
      break;
  }

  // Defensive floor: never sell below wholesale, no matter the rounding.
  return Math.max(retail, wholesaleCents);
}
