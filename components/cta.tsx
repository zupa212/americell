import Link from "next/link";

import AuroraBackground from "@/components/ui/aurora-background";
import { BorderBeam } from "@/components/ui/border-beam";
import Reveal from "@/components/ui/reveal";
import { ShimmerButton } from "@/components/ui/shimmer-button";

/**
 * Final full-width call-to-action band (Server Component).
 *
 * A centered brand→violet gradient panel with a subtle <BorderBeam/> accent,
 * layered over a soft aurora glow. Holds the Greek headline, a one-line
 * subhead, and a <ShimmerButton> CTA linking to /signup. Animated content is
 * wrapped in the <Reveal> client wrapper (and BorderBeam is client) so this
 * file stays a Server Component.
 */
export default function CallToAction() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      <AuroraBackground className="opacity-60" />
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <Reveal className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft px-6 py-20 text-center text-white shadow-glow-brand sm:px-12 sm:py-28">
          <AuroraBackground className="opacity-40" />
          <BorderBeam
            size={140}
            duration={8}
            colorFrom="#ffffff"
            colorTo="#5aa2ff"
            className="opacity-70"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="text-balance text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Βάλε ένα αληθινό τηλέφωνο ΗΠΑ στη δουλειά σήμερα.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              Διαχειρίζεσαι, αυτοματοποιείς και ελέγχεις ένα αληθινό smartphone
              ΗΠΑ από οπουδήποτε, ανά πάσα στιγμή.
            </p>

            <div className="mt-10 flex justify-center">
              <Link
                href="/signup"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-2"
              >
                <ShimmerButton
                  background="#ffffff"
                  shimmerColor="#2b6bff"
                  className="px-8 py-3 text-base font-medium text-foreground shadow-lg shadow-black/10"
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
