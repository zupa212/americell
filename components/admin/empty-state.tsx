import type { ReactNode } from "react";

import LottiePlayer from "@/components/ui/lottie";
import { cn } from "@/lib/utils";

/**
 * EmptyState — the shared frosted-glass "nothing here yet" panel for the admin.
 *
 * A single, consistent empty surface every admin page (customers, rentals,
 * orders, inventory, logs, billing) can drop in instead of hand-rolling its own
 * centered icon + text. Floats over the global aurora using the shared glass
 * recipe (`bg-white/60 backdrop-blur-xl border-white/50 ring-white/40`) with a
 * soft-glow `LottiePlayer` (defaults to `/lottie/pulse.json`) as its focal point.
 *
 * Presentational only — no hooks or handlers — so it renders fine from both
 * Server Components (the page shells) and Client Components (the "…-table"
 * files). The optional `action` slot carries whatever interactive control the
 * caller needs (a Button, a Link, a refresh trigger); its own "use client"
 * boundary travels with it, not with this shell.
 */
export type EmptyStateProps = {
  /** Headline, e.g. "No customers yet". English, sentence case. */
  title: string;
  /** Optional supporting line under the title. */
  description?: ReactNode;
  /** Optional interactive control (Button / Link) shown under the copy. */
  action?: ReactNode;
  /** Lottie source; defaults to the ambient brand pulse. */
  lottieSrc?: string;
  /** Size the animation, e.g. "h-24 w-24" (the default). */
  lottieClassName?: string;
  /** Extra classes on the outer glass card. */
  className?: string;
};

const glassCard =
  "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-white/50 bg-white/60 px-6 py-16 text-center backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

export function EmptyState({
  title,
  description,
  action,
  lottieSrc = "/lottie/pulse.json",
  lottieClassName = "h-24 w-24",
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(glassCard, className)}>
      {/* Soft brand wash so the Lottie reads as lit-from-within glass. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand/25 via-brand-2/15 to-transparent blur-2xl"
      />

      <div
        aria-hidden="true"
        className="relative flex items-center justify-center rounded-full border border-white/50 bg-white/50 p-3 backdrop-blur-md ring-1 ring-white/40"
      >
        <LottiePlayer src={lottieSrc} className={lottieClassName} />
      </div>

      <div className="relative max-w-md space-y-1.5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="relative mt-1">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
