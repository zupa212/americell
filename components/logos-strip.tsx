import { CLIENT_LOGOS } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

/**
 * LogosStrip — a slim frosted-glass trust bar that floats under the hero.
 *
 * Server component: presentational only, no interactivity. The section wrapper
 * is transparent so the global aurora shows through; the strip itself is a
 * slim frosted-glass band (bg-white/50 backdrop-blur-md border-y border-white/40)
 * containing a short muted descriptor line (Greek) followed by an infinite
 * Magic UI <Marquee> of client wordmarks rendered in a muted, uppercase,
 * tracking-wide style. Left/right fade masks blend the scrolling row into the
 * glass surface. The intro content is wrapped in the <Reveal> client wrapper
 * for a subtle scroll-in.
 */
export default function LogosStrip() {
  return (
    <section
      aria-label="Ομάδες που εμπιστεύονται αληθινές συσκευές ΗΠΑ"
      className="relative overflow-hidden"
    >
      <div
        className={cn(
          "border-y border-white/40 bg-white/50 backdrop-blur-md",
          "shadow-[0_10px_40px_-16px_rgba(30,41,120,0.15)]",
        )}
      >
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
                  className="mx-8 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors duration-300 hover:text-brand"
                >
                  {name}
                </span>
              ))}
            </Marquee>

            {/* Left/right fade masks blend the row into the glass surface */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-white/60 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-white/60 to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
