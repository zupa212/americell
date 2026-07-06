import type { ReactNode } from "react";

import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

/**
 * StatCard — a frosted-glass metric tile for the admin overview
 * (RESELLER_PLAN §6.2/§6.4).
 *
 * Floats over the global aurora using the shared glass recipe
 * (`bg-white/60 backdrop-blur-xl border-white/50 ring-white/40`) so the tint
 * shows through, with a slow `ShineBorder` for life. Presentational only — no
 * hooks or handlers — so it renders fine inside Server Components (the ShineBorder
 * child carries its own "use client").
 *
 * `value` and `sub` accept `ReactNode` so callers can pass pre-formatted money
 * (always via `fmtMoney`), an em dash for missing data, or richer markup.
 */
export type StatCardProps = {
  /** Short muted caption, e.g. "Credit balance". */
  label: string;
  /** The headline figure — pass money pre-formatted with `fmtMoney`. */
  value: ReactNode;
  /** Optional secondary line under the value (e.g. "estimate"). */
  sub?: ReactNode;
  /** Optional leading glyph (a lucide icon) shown in a glass chip. */
  icon?: ReactNode;
  /** Set false to drop the animated shine on denser grids. */
  shine?: boolean;
  className?: string;
};

const glassTile =
  "group relative overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-5 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

export function StatCard({
  label,
  value,
  sub,
  icon,
  shine = true,
  className,
}: StatCardProps) {
  return (
    <div className={cn(glassTile, className)}>
      {shine ? (
        <ShineBorder
          className="rounded-3xl"
          borderWidth={1}
          duration={14}
          shineColor={["var(--color-brand)", "var(--color-brand-2)"]}
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {icon ? (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-brand backdrop-blur-md [&_svg]:h-4 [&_svg]:w-4"
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p className="relative mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
        {value}
      </p>

      {sub ? (
        <p className="relative mt-1 text-xs text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  );
}

export default StatCard;
