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
 * containing a short, bold English trust line whose key nouns animate through
 * the brand gradient, followed by a seamless, infinite Magic UI <Marquee> of
 * client wordmarks — each paired with a tiny brand-gradient marker that lights
 * up on hover. A symmetric mask fade dissolves the scrolling row into the glass
 * on both edges (revealing the aurora behind, not a hard white overlay), and
 * the whole row gently pauses on hover. The intro content is wrapped in the
 * <Reveal> client wrapper for a subtle scroll-in.
 */

// Animated brand-gradient text: blue → violet → cyan, GPU-only pan that
// respects prefers-reduced-motion via the motion-safe variant.
const gradientWord =
  "bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient";

// Soft, symmetric edge fade. A mask (not a white overlay) dissolves the row
// into whatever sits behind the glass — so it reads correctly over the aurora.
const edgeFade = {
  maskImage:
    "linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)",
} as const;

export default function LogosStrip() {
  return (
    <section
      aria-label="Teams that run on real device infrastructure"
      className="relative overflow-hidden"
    >
      <div
        className={cn(
          "border-y border-white/40 bg-white/50 backdrop-blur-md",
          "shadow-[0_10px_40px_-16px_rgba(30,41,120,0.15)]",
        )}
      >
        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <Reveal>
            <p className="text-center text-base font-bold tracking-tight text-foreground sm:text-lg">
              Real <span className={gradientWord}>physical devices</span>
              <span aria-hidden="true" className="mx-2.5 text-border">
                &middot;
              </span>
              clean <span className={gradientWord}>residential IPs</span>
              <span aria-hidden="true" className="mx-2.5 text-border">
                &middot;
              </span>
              global <span className={gradientWord}>edge control</span>
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
              Trusted by teams at
            </p>
          </Reveal>

          <Reveal delay={0.16} as="div" className="mt-5 sm:mt-6">
            {/* Mask fade lives on the wrapper so the seamless Marquee row
                dissolves into the glass on both edges. */}
            <div className="relative" style={edgeFade}>
              <Marquee pauseOnHover className="[--duration:34s] [--gap:0px]">
                {CLIENT_LOGOS.map((name) => (
                  <div
                    key={name}
                    className="group/logo mx-7 flex items-center gap-2.5 sm:mx-9"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand to-brand-2 opacity-40 transition-all duration-300 group-hover/logo:scale-125 group-hover/logo:opacity-100"
                    />
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors duration-300 group-hover/logo:text-brand">
                      {name}
                    </span>
                  </div>
                ))}
              </Marquee>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
