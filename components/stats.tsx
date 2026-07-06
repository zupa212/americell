"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { AuroraText } from "@/components/ui/aurora-text";
import { ShineBorder } from "@/components/ui/shine-border";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Honest, non-inflated Americell stats. The `value` is the numeric part that
 * counts up; `prefix`/`suffix` frame it (e.g. "<", "+", "%", "/7") so the whole
 * thing still reads as the real headline figure.
 */
type Stat = {
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
};

const STATS: readonly Stat[] = [
  { value: 3, suffix: "+", label: "US locations" },
  { value: 100, suffix: "%", label: "real hardware" },
  { prefix: "<", value: 10, suffix: "s", label: "to connect" },
  { value: 24, suffix: "/7", label: "browser access" },
];

// Shared frosted-glass recipe used across the site.
const glassSurface =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const glassHover =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

const gradientText =
  "bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient";

// Run before paint on the client, but fall back to a plain effect on the
// server so React doesn't warn during prerender.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function CountUp({
  prefix,
  value,
  suffix,
  active,
}: {
  prefix?: string;
  value: number;
  suffix?: string;
  /** Becomes true once the row scrolls into view. */
  active: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const numberRef = useRef<HTMLSpanElement>(null);

  // Snap to 0 before first paint so we never flash the final value, unless the
  // user prefers reduced motion (then we keep the honest end value).
  useIsomorphicLayoutEffect(() => {
    const node = numberRef.current;
    if (!node || prefersReducedMotion) return;
    node.textContent = "0";
  }, [prefersReducedMotion]);

  useEffect(() => {
    const node = numberRef.current;
    if (!node) return;

    if (prefersReducedMotion) {
      node.textContent = String(value);
      return;
    }
    if (!active) return;

    const controls = animate(0, value, {
      duration: 1.6,
      // gentle "easeOutExpo"-ish curve — fast to settle, Apple-smooth
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [active, value, prefersReducedMotion]);

  return (
    <span aria-hidden="true" className="tabular-nums">
      {prefix}
      {/* SSR renders the real value for no-JS / SEO; the effect resets to 0. */}
      <span ref={numberRef}>{value}</span>
      {suffix}
    </span>
  );
}

export default function Stats() {
  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, {
    once: true,
    margin: "0px 0px -120px 0px",
  });

  return (
    <section
      id="stats"
      aria-labelledby="stats-heading"
      className="relative overflow-hidden"
    >
      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center" as="div">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              At a glance
            </p>
            <h2
              id="stats-heading"
              className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              <AuroraText>Americell</AuroraText>, by the numbers
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              No hype. Real US devices — iPhone and Android — ready to drive
              live from your browser.
            </p>
          </header>
        </Reveal>

        <div
          ref={rowRef}
          className="mt-14 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-6 lg:grid-cols-4"
        >
          {STATS.map((stat, i) => {
            const display = `${stat.prefix ?? ""}${stat.value}${
              stat.suffix ?? ""
            }`;

            return (
              <Reveal key={stat.label} as="div" delay={i * 0.08}>
                <div
                  className={cn(
                    "group relative flex h-full flex-col items-center justify-center overflow-hidden p-6 text-center sm:p-8",
                    glassSurface,
                    glassHover
                  )}
                >
                  <ShineBorder
                    shineColor={["#2b6bff", "#7c3aed", "#5aa2ff"]}
                    borderWidth={1}
                    duration={14}
                  />

                  <div className="relative">
                    <div
                      className={cn(
                        "text-5xl font-bold leading-none tracking-tight sm:text-6xl",
                        gradientText
                      )}
                    >
                      <CountUp
                        prefix={stat.prefix}
                        value={stat.value}
                        suffix={stat.suffix}
                        active={inView}
                      />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {stat.label}
                    </p>
                    {/* Accessible, non-animated full value for screen readers. */}
                    <span className="sr-only">{`${display} — ${stat.label}`}</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Americell brand touch */}
        <Reveal
          className="mt-10 flex items-center justify-center gap-2"
          as="div"
          delay={0.1}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand to-brand-2"
          />
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Measured, not marketed — that&apos;s how{" "}
            <span className={cn("font-semibold", gradientText)}>Americell</span>{" "}
            works.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
