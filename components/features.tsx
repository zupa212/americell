import type { ComponentType } from "react";
import { Smartphone, Globe, Zap, Users, type LucideProps } from "lucide-react";
import { FEATURES } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";

// Map the four feature keys to lucide icons. No external requests.
const ICONS: Record<string, ComponentType<LucideProps>> = {
  device: Smartphone,
  globe: Globe,
  bolt: Zap,
  users: Users,
};

// Shared frosted-glass recipe reused across surfaces.
const GLASS = cn(
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]"
);

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
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[feature.icon] ?? Smartphone;
            return (
              <Reveal key={feature.title} as="li" delay={i * 0.08}>
                <MagicCard
                  className={cn(
                    GLASS,
                    "h-full list-none",
                    "transition-all duration-300",
                    "hover:bg-white/70 hover:-translate-y-1",
                    "hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]"
                  )}
                  gradientColor="rgba(43,107,255,0.12)"
                  gradientFrom="#2b6bff"
                  gradientTo="#9E7AFF"
                  gradientOpacity={0.9}
                >
                  <div className="flex h-full flex-col gap-4 p-6">
                    {/* Icon in a frosted glass tile */}
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand ring-1 ring-white/40 backdrop-blur-md">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {feature.body}
                    </p>
                  </div>
                </MagicCard>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
