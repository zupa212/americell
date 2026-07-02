import Link from "next/link";

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
 * accent and ambient <Particles/> behind the glass. Holds the Greek headline, a
 * one-line subhead, and a <ShimmerButton> CTA linking to /signup. Animated
 * content is wrapped in the <Reveal> client wrapper so this file stays a
 * Server Component.
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
            shineColor={["#2b6bff", "#7c5cff", "#8fb8ff"]}
            className="rounded-3xl"
          />
          <BorderBeam
            size={140}
            duration={8}
            colorFrom="#2b6bff"
            colorTo="#7c5cff"
            className="opacity-70"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="text-balance text-4xl leading-[1.05] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Βάλε ένα αληθινό τηλέφωνο ΗΠΑ στη δουλειά σήμερα.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Διαχειρίζεσαι, αυτοματοποιείς και ελέγχεις ένα αληθινό smartphone
              ΗΠΑ από οπουδήποτε, ανά πάσα στιγμή.
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
                  Ξεκίνα τώρα
                </ShimmerButton>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
