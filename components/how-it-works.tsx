"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Smartphone, WandSparkles, Zap } from "lucide-react";

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

// One accent icon per step, mapped by index onto the (unchanged) STEP copy.
const STEP_ICONS = [Smartphone, Zap, WandSparkles] as const;

export default function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  // Draw the connecting line as the row scrolls through the viewport.
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 80%", "end 60%"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

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
              From provisioning to{" "}
              <AuroraText>full remote control</AuroraText>
              <span className="text-muted-foreground">
                {" "}
                in minutes, not procurement cycles.
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              No office hardware, no cables, no babysitting. Provision real
              iPhones and Android devices in minutes, drive the fleet from one
              dashboard, and keep every session under role-based access,
              recording, and full logs.
            </p>
          </header>
        </Reveal>

        <ol
          ref={listRef}
          role="list"
          className="relative mt-14 grid grid-cols-1 gap-6 sm:mt-16 md:grid-cols-3 md:gap-8"
        >
          {/* Connecting line across the row on md+ — a faint track with a
              gradient fill that draws left→right as the section scrolls in. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-[3.75rem] hidden md:block"
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
            <motion.div
              className="absolute inset-0 h-px origin-left bg-gradient-to-r from-brand via-brand-2 to-brand-soft"
              style={
                prefersReducedMotion ? { scaleX: 1 } : { scaleX: lineScaleX }
              }
            />
          </div>

          {STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? STEP_ICONS[STEP_ICONS.length - 1];
            const delay = i * 0.12;

            return (
              <motion.li
                key={step.n}
                className="relative"
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 28, scale: 0.96, filter: "blur(6px)" }
                }
                whileInView={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                }
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                  delay,
                  opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay },
                  filter: { duration: 0.5, ease: "easeOut", delay },
                }}
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                style={{ willChange: "transform, opacity, filter" }}
              >
                <Card
                  className={cn(
                    "group relative h-full gap-4 overflow-hidden p-6 sm:p-8",
                    glassSurface,
                    glassHover
                  )}
                >
                  <ShineBorder
                    shineColor={["#2b6bff", "#7c3aed", "#22d3ee"]}
                    borderWidth={1}
                    duration={14}
                  />

                  {/* Oversized watermark icon — subtle depth that reacts on hover */}
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.25}
                    className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-brand/[0.06] transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110"
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
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70"
                      >
                        <Icon
                          strokeWidth={2}
                          className="h-4 w-4 text-brand transition-transform duration-300 group-hover:scale-110"
                        />
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
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
