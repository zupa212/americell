import { STEPS } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import AuroraBackground from "@/components/ui/aurora-background";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

export default function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="relative overflow-hidden bg-background"
    >
      <AuroraBackground className="opacity-70" />
      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <Reveal className="max-w-2xl" as="div">
          <header>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Πώς λειτουργεί
            </p>
            <h2
              id="how-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Από αληθινό τηλέφωνο ΗΠΑ σε{" "}
              <AuroraText>τηλεχειρισμό</AuroraText> σε τρία βήματα
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Χωρίς καλώδια, χωρίς τοπικό εξοπλισμό, χωρίς αναμονές logistics.
              Ξεκίνα μια αυθεντική συσκευή και άρχισε να τη χειρίζεσαι από τον
              browser σου.
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
                  "h-full gap-4 p-8 transition duration-300",
                  "hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/10"
                )}
              >
                <CardHeader className="gap-4 px-0">
                  <Badge
                    aria-hidden="true"
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-xl font-bold text-white shadow-lg shadow-brand/25"
                  >
                    {step.n}
                  </Badge>
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    <span className="sr-only">{`Βήμα ${step.n}: `}</span>
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
