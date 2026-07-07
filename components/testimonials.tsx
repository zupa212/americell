import { Quote } from "lucide-react";
import Reveal from "@/components/ui/reveal";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { TESTIMONIALS } from "@/lib/site";
import { cn } from "@/lib/utils";

const glassCard = cn(
  "relative h-full overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-7 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
);

export default function Testimonials() {
  return (
    <section
      id="clients"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-3xl">
          {/* Flashy frosted-glass eyebrow with a live brand-gradient dot */}
          <div
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full py-1 pl-2.5 pr-3.5 text-sm",
              "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
              "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
            )}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] motion-safe:animate-gradient shadow-[0_0_10px_rgba(43,107,255,0.7)]"
            />
            <AnimatedShinyText className="font-semibold uppercase tracking-[0.14em] text-brand">
              Clients
            </AnimatedShinyText>
          </div>

          <h2 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
            Trusted by teams on{" "}
            <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              real US devices
            </span>
            .
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            QA leads, agencies, and growth teams operate genuine US hardware from
            anywhere — no shipping, no cables.
          </p>
        </Reveal>

        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal
              key={testimonial.name}
              as="li"
              delay={0.1 * index}
              className="list-none"
            >
              <figure className={glassCard}>
                <ShineBorder
                  className="rounded-3xl"
                  borderWidth={1}
                  duration={16}
                  shineColor={["#2b6bff", "#7aa2ff", "#b9c9ff"]}
                />

                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand backdrop-blur-md ring-1 ring-white/40">
                  <Quote
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </span>

                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="mt-6 flex flex-col items-start gap-0.5 border-t border-white/40 pt-5">
                  <div className="text-sm font-bold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
