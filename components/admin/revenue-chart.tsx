"use client";

import { useId, useMemo, useState } from "react";

import { fmtMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * RevenueChart — a compact, dependency-free bar/area chart of booked revenue
 * for the admin overview (RESELLER_PLAN §6). Renders `data` (the zero-filled
 * `revenueByDay()` series from `@/lib/admin-data`) as inline SVG bars with a
 * brand→violet gradient fill, a soft area envelope, a live y-axis and hover
 * tooltips. Pure SVG — NO chart library.
 *
 * Client component so it can own the hover state; the parent (a Server
 * Component) fetches `revenueByDay()` and passes the plain array in.
 *
 * Money is ALWAYS integer cents; every currency string goes through `fmtMoney`.
 * Dates are formatted with an explicit `UTC` timeZone so the server and client
 * emit byte-identical markup (the buckets are UTC calendar days) — no hydration
 * mismatch. Accessibility: the `<svg>` is `role="img"` labelled by its
 * `<title>`/`<desc>`, and a visually-hidden list restates every day's figure
 * for screen readers.
 */

export type RevenuePoint = {
  /** UTC calendar day, `YYYY-MM-DD`. */
  day: string;
  revenueCents: number;
};

export type RevenueChartProps = {
  /** Oldest → newest, contiguous & zero-filled (straight from `revenueByDay()`). */
  data: RevenuePoint[];
  /** ISO-4217 code for `fmtMoney`; defaults to the app currency ("usd"). */
  currency?: string;
  className?: string;
};

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 p-5 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

// ViewBox geometry (unitless; the SVG scales to fill its container width).
const W = 720;
const H = 240;
const PAD_L = 54;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 30;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BASELINE = PAD_T + PLOT_H;
const TICKS = 4;

/** Round `n` up to a friendly axis maximum (1/2/2.5/5/10 × 10ⁿ). */
function niceCeil(n: number): number {
  if (n <= 0) return 0;
  const pow = 10 ** Math.floor(Math.log10(n));
  const f = n / pow;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * pow;
}

/** Path for a rectangle rounded on its TOP two corners only. */
function barPath(x: number, top: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${top + h} L${x},${top + rr} Q${x},${top} ${x + rr},${top} L${
    x + w - rr
  },${top} Q${x + w},${top} ${x + w},${top + rr} L${x + w},${top + h} Z`;
}

export function RevenueChart({ data, currency = "usd", className }: RevenueChartProps) {
  const uid = useId();
  const gradId = `rev-bar-${uid}`;
  const areaId = `rev-area-${uid}`;
  const titleId = `rev-title-${uid}`;
  const descId = `rev-desc-${uid}`;

  const [active, setActive] = useState<number | null>(null);

  const points = data ?? [];
  const n = points.length;

  // Deterministic, UTC-pinned formatters (stable server↔client output).
  const fmt = useMemo(
    () => ({
      short: new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "numeric",
        timeZone: "UTC",
      }),
      long: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      axis: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    }),
    [currency],
  );

  const model = useMemo(() => {
    const values = points.map((p) => p.revenueCents);
    const rawMax = values.length ? Math.max(...values) : 0;
    const yMax = rawMax > 0 ? niceCeil(rawMax) : 1;
    const total = values.reduce((a, b) => a + b, 0);
    const maxIdx = values.reduce(
      (best, v, i) => (v > values[best] ? i : best),
      0,
    );

    const slot = n > 0 ? PLOT_W / n : PLOT_W;
    const barW = Math.max(4, Math.min(slot * 0.6, 44));
    // Show ~7 x-axis labels at most; always keep the newest day labelled.
    const labelStep = Math.max(1, Math.ceil(n / 7));

    const bars = points.map((p, i) => {
      const x = PAD_L + slot * i + (slot - barW) / 2;
      const cx = x + barW / 2;
      const h = yMax > 0 ? (p.revenueCents / yMax) * PLOT_H : 0;
      const top = BASELINE - h;
      const parsed = new Date(`${p.day}T00:00:00Z`);
      const valid = !Number.isNaN(parsed.getTime());
      return {
        i,
        x,
        cx,
        top,
        h,
        barW,
        value: p.revenueCents,
        showLabel: i % labelStep === 0 || i === n - 1,
        shortLabel: valid ? fmt.short.format(parsed) : p.day,
        longLabel: valid ? fmt.long.format(parsed) : p.day,
      };
    });

    // Envelope for the soft area fill (top of each bar), closed to the baseline.
    const areaPath =
      bars.length > 0
        ? `M${bars[0].cx},${BASELINE} ` +
          bars.map((b) => `L${b.cx},${b.top}`).join(" ") +
          ` L${bars[bars.length - 1].cx},${BASELINE} Z`
        : "";

    const ticks = Array.from({ length: TICKS + 1 }, (_, k) => {
      const value = (yMax / TICKS) * k;
      return { value, y: BASELINE - (value / yMax) * PLOT_H };
    });

    return { bars, areaPath, ticks, yMax, total, rawMax, maxIdx };
  }, [points, n, fmt]);

  const { bars, areaPath, ticks, total, rawMax, maxIdx } = model;
  const activeBar = active !== null ? bars[active] : null;

  // Empty state — never render a broken axis.
  if (n === 0) {
    return (
      <div className={cn(glassCard, className)}>
        <Header total={total} currency={currency} days={0} />
        <p className="py-12 text-center text-sm text-muted-foreground">
          No revenue data yet.
        </p>
      </div>
    );
  }

  const tooltipLeft = activeBar
    ? Math.min(92, Math.max(8, (activeBar.cx / W) * 100))
    : 0;

  return (
    <div className={cn(glassCard, className)}>
      <Header total={total} currency={currency} days={n} />

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={titleId}>Revenue by day chart</title>
          <desc id={descId}>
            Revenue for the last {n} days. Total{" "}
            {fmtMoney(total, currency)}. Highest day{" "}
            {fmtMoney(rawMax, currency)} ({bars[maxIdx]?.longLabel}).
          </desc>

          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" />
              <stop offset="100%" stopColor="var(--color-brand-2)" />
            </linearGradient>
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-brand)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="var(--color-brand-2)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>

          {/* Gridlines + y-axis (compact money) */}
          {ticks.map((t) => (
            <g key={t.value}>
              <line
                x1={PAD_L}
                y1={t.y}
                x2={W - PAD_R}
                y2={t.y}
                stroke="rgba(30,41,120,0.10)"
                strokeWidth={1}
                strokeDasharray={t.value === 0 ? undefined : "3 5"}
              />
              <text
                x={PAD_L - 8}
                y={t.y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
                className="fill-current text-[11px] text-muted-foreground tabular-nums"
              >
                {fmt.axis.format(t.value / 100)}
              </text>
            </g>
          ))}

          {/* Soft area envelope under the bar-tops */}
          {areaPath ? <path d={areaPath} fill={`url(#${areaId})`} /> : null}

          {/* Active-day guide line */}
          {activeBar ? (
            <line
              x1={activeBar.cx}
              y1={PAD_T}
              x2={activeBar.cx}
              y2={BASELINE}
              stroke="var(--color-brand)"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ) : null}

          {/* Bars */}
          {bars.map((b) => {
            const dim = active !== null && active !== b.i;
            return b.h > 0.5 ? (
              <path
                key={b.i}
                d={barPath(b.x, b.top, b.barW, b.h, 5)}
                fill={`url(#${gradId})`}
                opacity={dim ? 0.5 : 1}
                className="transition-opacity duration-150"
              />
            ) : (
              // Zero-revenue day: a faint baseline stub so the day still reads.
              <line
                key={b.i}
                x1={b.x}
                y1={BASELINE}
                x2={b.x + b.barW}
                y2={BASELINE}
                stroke="rgba(30,41,120,0.18)"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={dim ? 0.5 : 1}
              />
            );
          })}

          {/* Active-day cap dot */}
          {activeBar && activeBar.h > 0.5 ? (
            <circle
              cx={activeBar.cx}
              cy={activeBar.top}
              r={3.5}
              fill="var(--color-brand)"
              stroke="white"
              strokeWidth={1.5}
            />
          ) : null}

          {/* x-axis day labels (thinned to avoid crowding) */}
          {bars.map((b) =>
            b.showLabel ? (
              <text
                key={b.i}
                x={b.cx}
                y={BASELINE + 18}
                textAnchor="middle"
                fill="currentColor"
                className="fill-current text-[11px] text-muted-foreground tabular-nums"
              >
                {b.shortLabel}
              </text>
            ) : null,
          )}

          {/* Transparent hover targets (one per day-slot) */}
          {bars.map((b) => (
            <rect
              key={b.i}
              x={PAD_L + (PLOT_W / n) * b.i}
              y={PAD_T}
              width={PLOT_W / n}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setActive(b.i)}
              onMouseLeave={() => setActive((cur) => (cur === b.i ? null : cur))}
              aria-hidden="true"
            />
          ))}
        </svg>

        {/* Hover tooltip (glass) — tracks the active bar horizontally */}
        {activeBar ? (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-center shadow-[0_10px_30px_-12px_rgba(30,41,120,0.35)] backdrop-blur-md"
            style={{ left: `${tooltipLeft}%` }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {activeBar.longLabel}
            </p>
            <p className="text-sm font-semibold tracking-tight text-foreground tabular-nums">
              {fmtMoney(activeBar.value, currency)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Screen-reader breakdown — the visual chart is decorative to AT. */}
      <ul className="sr-only">
        {bars.map((b) => (
          <li key={b.i}>
            {b.longLabel}: {fmtMoney(b.value, currency)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Header({
  total,
  currency,
  days,
}: {
  total: number;
  currency: string;
  days: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Revenue
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {days > 0
            ? `Last ${days.toLocaleString("en-US")} days`
            : "No activity"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Total
        </p>
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {fmtMoney(total, currency)}
        </p>
      </div>
    </div>
  );
}

export default RevenueChart;
