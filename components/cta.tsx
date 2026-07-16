"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check, MoveRight } from "lucide-react";

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { AuroraText } from "@/components/ui/aurora-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { Particles } from "@/components/ui/particles";
import Reveal from "@/components/ui/reveal";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

/**
 * Final full-width call-to-action band (Client Component).
 *
 * A hero-style FROSTED GLASS panel floating over the global <SiteBackground/>
 * (aurora + dot grid). The section wrapper is transparent so the aurora shows
 * through; the panel itself is frosted glass tinted with a brand→violet→cyan
 * wash, framed by dual counter-rotating <BorderBeam/>s + a <ShineBorder/>, with
 * slow-drifting aurora orbs and ambient <Particles/> behind the glass (all
 * suppressed under prefers-reduced-motion). Holds the English, Apple-grade
 * headline ("Ready to get the phones out of the office?") with a flashy
 * blue→violet→cyan <AuroraText> keyword, a two-line subhead, an assurance row of
 * four bullets, a <ShimmerButton> primary CTA to /signup ("Deploy your fleet")
 * and a glass secondary to /contact ("Talk to Sales"). Enterprise positioning —
 * AMERICELL is remote phone infrastructure: real, physical iPhone and Android
 * devices we host, power, connect and maintain, driven from one dashboard.
 */
export default function CallToAction() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal
          className={cn(
            "group relative isolate overflow-hidden rounded-3xl px-5 py-16 text-center sm:px-12 sm:py-28",
            "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
            "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
            "transition-all duration-300 hover:bg-white/70 hover:shadow-[0_28px_80px_-28px_rgba(43,107,255,0.45)]",
          )}
        >
          {/* Brand gradient wash tinting the glass */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
          />

          {/* Slow-drifting aurora orbs for ambient depth */}
          {!prefersReducedMotion && (
            <>
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 -z-10 h-64 w-64 rounded-full bg-brand/25 blur-3xl"
                animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{ willChange: "transform" }}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -right-16 -z-10 h-72 w-72 rounded-full bg-brand-2/25 blur-3xl"
                animate={{ x: [0, -26, 0], y: [0, -18, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                style={{ willChange: "transform" }}
              />
            </>
          )}

          {/* Ambient depth behind the glass */}
          <Particles
            className="pointer-events-none absolute inset-0 -z-10"
            quantity={70}
            ease={80}
            color="#2b6bff"
            refresh={false}
          />

          {/* Animated frosted trim — shine border + dual counter-rotating beams */}
          <ShineBorder
            borderWidth={1}
            duration={14}
            shineColor={["#2b6bff", "#7c3aed", "#22d3ee"]}
            className="rounded-3xl"
          />
          <BorderBeam
            size={140}
            duration={8}
            colorFrom="#2b6bff"
            colorTo="#22d3ee"
            className="opacity-70"
          />
          <BorderBeam
            size={140}
            duration={8}
            delay={4}
            reverse
            colorFrom="#7c3aed"
            colorTo="#2b6bff"
            className="opacity-60"
          />

          <div className="relative mx-auto max-w-3xl">
            {/* eyebrow — flashy frosted pill */}
            <div className="flex justify-center">
              <div
                className={cn(
                  "inline-flex items-center rounded-full px-3.5 py-1 text-sm",
                  "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
                  "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
                )}
              >
                <AnimatedShinyText className="inline-flex items-center justify-center text-brand">
                  Remote phone infrastructure
                </AnimatedShinyText>
              </div>
            </div>

            <h2
              id="cta-heading"
              className="mt-6 text-balance break-words text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-6xl sm:leading-[1.02] lg:text-7xl"
            >
              Ready to get the phones{" "}
              <AuroraText colors={["#2b6bff", "#7c3aed", "#22d3ee"]}>
                out of the office
              </AuroraText>
              ?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Your servers don&apos;t live in a closet anymore. Your phone fleet
              shouldn&apos;t either. Start with a single device or scale to
              hundreds — we handle the hardware, you keep the control.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-full transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <ShimmerButton
                  background="#2b6bff"
                  shimmerColor="#ffffff"
                  className="px-8 py-3 text-base font-medium text-white shadow-lg shadow-brand/20"
                >
                  Deploy your fleet
                </ShimmerButton>
              </Link>

              <Link
                href="/contact"
                className={cn(
                  "group/secondary inline-flex items-center gap-2 rounded-full px-7 py-3 text-base font-medium text-foreground",
                  "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
                  "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                )}
              >
                Talk to Sales
                <MoveRight
                  aria-hidden="true"
                  className="size-4 text-brand transition-transform duration-300 group-hover/secondary:translate-x-1"
                />
              </Link>
            </div>

            {/* Assurance row — enterprise reassurance bullets */}
            <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand"
                />
                <span className="text-pretty">
                  Live in minutes, not procurement cycles
                </span>
              </li>
              <li className="inline-flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand"
                />
                <span className="text-pretty">No setup fees, cancel anytime</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand"
                />
                <span className="text-pretty">
                  Hardware maintenance and replacement included
                </span>
              </li>
              <li className="inline-flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand"
                />
                <span className="text-pretty">DPA available for enterprise</span>
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
