import { CLIENT_LOGOS } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import AuroraBackground from "@/components/ui/aurora-background";
import { Marquee } from "@/components/ui/marquee";

/**
 * LogosStrip — a slim trust bar that sits directly under the hero.
 *
 * Server component: presentational only, no interactivity. A short muted
 * descriptor line (Greek) followed by an infinite Magic UI <Marquee> of client
 * wordmarks rendered in a muted, uppercase, tracking-wide style. Left/right
 * fade masks blend the scrolling row into the surface. The intro content is
 * wrapped in the <Reveal> client wrapper for a subtle scroll-in.
 */
export default function LogosStrip() {
  return (
    <section
      aria-label="Ομάδες που εμπιστεύονται αληθινές συσκευές ΗΠΑ"
      className="relative overflow-hidden border-y bg-card"
    >
      <AuroraBackground className="opacity-40" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-10 sm:py-12">
        <Reveal>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Αληθινές συσκευές ΗΠΑ
            <span aria-hidden="true" className="mx-2 text-border">
              &middot;
            </span>
            καθαρές οικιακές IP
            <span aria-hidden="true" className="mx-2 text-border">
              &middot;
            </span>
            ζωντανός έλεγχος από browser
          </p>
        </Reveal>

        <div className="relative mt-7 sm:mt-8">
          <Marquee pauseOnHover className="[--duration:28s]">
            {CLIENT_LOGOS.map((name) => (
              <span
                key={name}
                className="mx-8 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors duration-200 hover:text-brand"
              >
                {name}
              </span>
            ))}
          </Marquee>

          {/* Left/right fade masks blend the row into the surface */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-card to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-card to-transparent"
          />
        </div>
      </div>
    </section>
  );
}
