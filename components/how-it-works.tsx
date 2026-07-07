import { STEPS } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuroraText } from "@/components/ui/aurora-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

const glassSurface =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const glassHover =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

export default function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="relative overflow-hidden"
    >
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal className="max-w-3xl" as="div">
          <header>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft"
              />
              How it works
            </p>
            <h2
              id="how-heading"
              className="mt-4 text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl lg:text-6xl"
            >
              Real US phone to{" "}
              <AuroraText>live control</AuroraText>
              <span className="text-muted-foreground"> in three steps.</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              No cables. No local hardware. No shipping. Spin up a genuine
              device and start driving it straight from your browser.
            </p>
          </header>
        </Reveal>

        <ol
          role="list"
          className="relative mt-14 grid grid-cols-1 gap-6 sm:mt-16 md:grid-cols-3 md:gap-8"
        >
          {/* Subtle connecting line across the row on md+ */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[3.75rem] hidden h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent md:block"
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.n} as="li" delay={i * 0.1}>
              <Card
                className={cn(
                  "relative h-full gap-4 overflow-hidden p-6 sm:p-8",
                  glassSurface,
                  glassHover
                )}
              >
                <ShineBorder
                  shineColor={["#2b6bff", "#7c3aed", "#22d3ee"]}
                  borderWidth={1}
                  duration={14}
                />
                <CardHeader className="relative gap-5 px-0">
                  <div className="flex items-center gap-4">
                    <Badge
                      aria-hidden="true"
                      className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-2xl font-bold text-white shadow-lg shadow-brand/25 ring-1 ring-white/40"
                    >
                      {step.n}
                    </Badge>
                    <span
                      aria-hidden="true"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70"
                    >
                      Step {step.n}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    <span className="sr-only">{`Step ${step.n}: `}</span>
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {step.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
