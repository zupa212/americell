import Link from "next/link";

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { AuroraText } from "@/components/ui/aurora-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { Particles } from "@/components/ui/particles";
import Reveal from "@/components/ui/reveal";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

/**
 * Final full-width call-to-action band (Server Component).
 *
 * A hero-style FROSTED GLASS panel floating over the global <SiteBackground/>
 * (aurora + dot grid). The section wrapper is transparent so the aurora shows
 * through; the panel itself is frosted glass with a <ShineBorder/> + <BorderBeam/>
 * accent and ambient <Particles/> behind the glass. Holds an English, Apple-grade
 * headline ("Put a real US phone to work today.") with a flashy blue→violet→cyan
 * <AuroraText> keyword, a one-line subhead, and a <ShimmerButton> CTA linking to
 * /signup. Animated content is wrapped in the <Reveal> client wrapper so this
 * file stays a Server Component. Honest positioning — real US devices you drive
 * live from the browser for testing, QA, localization, and growth teams.
 */
export default function CallToAction() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <Reveal
          className={cn(
            "relative isolate overflow-hidden rounded-3xl px-6 py-20 text-center sm:px-12 sm:py-28",
            "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
            "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
            "transition-all duration-300 hover:bg-white/70",
          )}
        >
          {/* Ambient depth behind the glass */}
          <Particles
            className="pointer-events-none absolute inset-0 -z-10"
            quantity={70}
            ease={80}
            color="#2b6bff"
            refresh={false}
          />

          {/* Animated frosted borders */}
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
                  Live in minutes · no installs
                </AnimatedShinyText>
              </div>
            </div>

            <h2
              id="cta-heading"
              className="mt-6 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl"
            >
              Put a real{" "}
              <AuroraText colors={["#2b6bff", "#7c3aed", "#22d3ee"]}>
                US phone
              </AuroraText>{" "}
              to work today.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Real iPhone &amp; Android hardware in the US, driven live from your
              browser — built for app testing, QA, localization, and growth teams.
            </p>

            <div className="mt-10 flex justify-center">
              <Link
                href="/signup"
                className="rounded-full transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <ShimmerButton
                  background="#2b6bff"
                  shimmerColor="#ffffff"
                  className="px-8 py-3 text-base font-medium text-white shadow-lg shadow-brand/20"
                >
                  Get started
                </ShimmerButton>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
