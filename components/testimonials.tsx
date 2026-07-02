import { Quote } from "lucide-react";
import Reveal from "@/components/ui/reveal";
import { ShineBorder } from "@/components/ui/shine-border";
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
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-2">
            Πελάτες
          </p>
          <h2 className="mt-3 text-balance bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Έμπιστο από ομάδες που δοκιμάζουν σε αληθινές συσκευές
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Υπεύθυνοι QA, πρακτορεία και ομάδες ανάπτυξης χρησιμοποιούν το
            Americell για να ελέγχουν γνήσιο υλικό ΗΠΑ από οπουδήποτε — χωρίς
            αποστολές, χωρίς καλώδια.
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
