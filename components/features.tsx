import type { ComponentType } from "react";
import { Smartphone, Globe, Zap, Users, type LucideProps } from "lucide-react";
import { FEATURES } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Map the four feature keys to lucide icons. No external requests.
const ICONS: Record<string, ComponentType<LucideProps>> = {
  device: Smartphone,
  globe: Globe,
  bolt: Zap,
  users: Users,
};

export default function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* Section header */}
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Γιατί Americell
          </p>
          <h2
            id="features-heading"
            className="mt-4 bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl"
          >
            Αληθινές συσκευές ΗΠΑ, πλήρως υπό τον έλεγχό σου.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Όλα όσα χρειάζεσαι για να δοκιμάζεις, να αυτοματοποιείς και να
            χειρίζεσαι αληθινά τηλέφωνα ΗΠΑ από οπουδήποτε — φτιαγμένο για
            πρακτορεία, δοκιμαστές εφαρμογών και ομάδες ανάπτυξης.
          </p>
        </Reveal>

        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[feature.icon] ?? Smartphone;
            return (
              <Reveal key={feature.title} as="li" delay={i * 0.08}>
                <Card
                  className={cn(
                    "h-full list-none gap-4 p-6 transition duration-300",
                    "hover:-translate-y-0.5 hover:ring-brand/30 hover:shadow-card"
                  )}
                >
                  <CardHeader className="gap-4 p-0">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.body}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
