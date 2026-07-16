"use client";

import type { ComponentType } from "react";
import { Smartphone, Globe, Zap, Users, type LucideProps } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { FEATURES } from "@/lib/site";
import Reveal from "@/components/ui/reveal";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BorderBeam } from "@/components/ui/border-beam";
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

// Bento rhythm: alternating wide/narrow cells for a varied, premium grid.
const SPANS = ["lg:col-span-2", "lg:col-span-1", "lg:col-span-1", "lg:col-span-2"];

// Per-card BorderBeam endpoints — on-brand blue → violet → soft blue.
const BEAMS = [
  { from: "#2b6bff", to: "#7c3aed" },
  { from: "#7c3aed", to: "#5aa2ff" },
  { from: "#5aa2ff", to: "#2b6bff" },
  { from: "#2b6bff", to: "#7c3aed" },
] as const;

// Grid orchestrates a staggered spring cascade for its cards.
const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

// Each cell springs up + de-blurs as the grid enters the viewport.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.96, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 26,
      mass: 0.9,
      opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

export default function Features() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <Reveal className="max-w-3xl">
          {/* Flashy frosted-glass eyebrow with a live brand-gradient dot */}
          <div
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full py-1 pl-2.5 pr-3.5 text-sm",
              "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
              "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]"
            )}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] motion-safe:animate-gradient shadow-[0_0_10px_rgba(43,107,255,0.7)]"
            />
            <AnimatedShinyText className="font-semibold uppercase tracking-[0.14em] text-brand">
              Managed fleet infrastructure
            </AnimatedShinyText>
          </div>

          <h2
            id="features-heading"
            className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl"
          >
            Real iPhones and Androids,{" "}
            <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              managed like infrastructure
            </span>
            .
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            We host, power, connect, and maintain a fleet of real US phones — you
            get full control from one dashboard, role-based access, session
            recording, and global edge streaming under 50ms. No office hardware,
            no cables, no babysitting.
          </p>
        </Reveal>

        {/* Feature grid — bento layout of premium MagicCard glass cells */}
        <motion.ul
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={prefersReducedMotion ? undefined : gridVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        >
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[feature.icon] ?? Smartphone;
            const span = SPANS[i % SPANS.length];
            const beam = BEAMS[i % BEAMS.length];
            const wide = span.includes("col-span-2");

            return (
              <motion.li
                key={feature.title}
                variants={prefersReducedMotion ? undefined : cardVariants}
                className={cn("list-none", span)}
                style={{ willChange: "transform, opacity, filter" }}
              >
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="h-full"
                  style={{ willChange: "transform" }}
                >
                  <MagicCard
                    className={cn(
                      GLASS,
                      "h-full",
                      "transition-all duration-300",
                      "hover:bg-white/70 hover:-translate-y-1",
                      "hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]"
                    )}
                    gradientColor="rgba(43,107,255,0.12)"
                    gradientFrom="#2b6bff"
                    gradientTo="#9E7AFF"
                    gradientOpacity={0.9}
                  >
                    {/* Hover-revealed BorderBeam pair (rounded to match the card) */}
                    {!prefersReducedMotion && (
                      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <BorderBeam
                          size={120}
                          duration={7}
                          colorFrom={beam.from}
                          colorTo={beam.to}
                        />
                        <BorderBeam
                          size={120}
                          duration={7}
                          delay={3.5}
                          colorFrom={beam.to}
                          colorTo={beam.from}
                        />
                      </div>
                    )}

                    {/* Soft brand glow that blooms on hover */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-brand/25 via-brand-2/20 to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    />

                    <div
                      className={cn(
                        "flex h-full flex-col gap-4 p-6 sm:p-7",
                        wide && "lg:min-h-[15rem]"
                      )}
                    >
                      {/* Bold, living brand-gradient icon tile */}
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] text-white shadow-[0_8px_24px_-8px_rgba(43,107,255,0.6)] ring-1 ring-white/40 motion-safe:animate-gradient">
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
                </motion.div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
