"use client";

import type { ComponentType } from "react";
import { useRef, useState } from "react";
import {
  Smartphone,
  MonitorSmartphone,
  Globe2,
  ShieldCheck,
  Rocket,
  type LucideProps,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";

import Reveal from "@/components/ui/reveal";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

/** Shared frosted-glass recipe, reused across every AMERICELL surface. */
const GLASS = cn(
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]"
);

/** On-brand aurora sweep for the "Americell" wordmark: blue → violet → soft blue. */
const BRAND_AURORA = ["#2b6bff", "#7c3aed", "#5aa2ff", "#2b6bff"];

/** Fixed brand shine for the sticky stage (avoids abrupt per-step color jumps). */
const STAGE_SHINE = ["#2b6bff", "#7c3aed", "#5aa2ff"];

type Benefit = {
  num: string;
  title: string;
  body: string;
  Icon: ComponentType<LucideProps>;
  /** ShineBorder sweep colors for this card. */
  shine: string[];
  /** BorderBeam endpoints for this card. */
  beam: { from: string; to: string };
};

const BENEFITS: readonly Benefit[] = [
  {
    num: "01",
    title: "Real US hardware.",
    body: "Operate real iPhones and Androids physically located in the United States — no emulators, no virtual machines. Built for app testing, QA, and market research under authentic conditions.",
    Icon: Smartphone,
    shine: ["#2b6bff", "#7aa2ff", "#c7d7ff"],
    beam: { from: "#2b6bff", to: "#7c3aed" },
  },
  {
    num: "02",
    title: "Live control, in your browser.",
    body: "Watch the screen in real time and tap, type, and swipe as if the device were in your hand. Nothing to install — just your browser and low latency.",
    Icon: MonitorSmartphone,
    shine: ["#7c3aed", "#9E7AFF", "#d9c7ff"],
    beam: { from: "#7c3aed", to: "#2b6bff" },
  },
  {
    num: "03",
    title: "Clean US residential IPs.",
    body: "Every device runs on a genuine US home connection, so you see content, pricing, and experiences like a local — for legitimate localization, growth, and ad-review testing.",
    Icon: Globe2,
    shine: ["#2b6bff", "#5aa2ff", "#c7d7ff"],
    beam: { from: "#5aa2ff", to: "#7c3aed" },
  },
  {
    num: "04",
    title: "Secure, PIN-locked, isolated.",
    body: "Every rental is yours alone: PIN protection, an encrypted connection, and a clean device between sessions. You control access — we keep the data safe.",
    Icon: ShieldCheck,
    shine: ["#7c3aed", "#2b6bff", "#c7d7ff"],
    beam: { from: "#2b6bff", to: "#5aa2ff" },
  },
  {
    num: "05",
    title: "Ready in seconds.",
    body: "Pick a device, start the rental, and take control almost instantly. No shipping, no logistics waits — just press play.",
    Icon: Rocket,
    shine: ["#2b6bff", "#7c3aed", "#5aa2ff"],
    beam: { from: "#7c3aed", to: "#2b6bff" },
  },
] as const;

/** Each benefit card springs up + de-blurs as it scrolls into view. */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 210,
      damping: 26,
      mass: 0.9,
      opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

/** Crossfade for the sticky stage mirror as the active benefit changes. */
const stageVariants: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: "blur(6px)",
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function BenefitsStack() {
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion ?? false;

  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Drive the sticky-scroll reveal: progress runs 0 → 1 as the benefits column
  // travels from the middle of the viewport to its end. Passive by default.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start center", "end center"],
  });
  const activeIndex = useTransform(scrollYProgress, (v) =>
    Math.min(
      BENEFITS.length - 1,
      Math.max(0, Math.round(v * (BENEFITS.length - 1)))
    )
  );
  useMotionValueEvent(activeIndex, "change", (v) => {
    if (!reduced) setActive(v);
  });

  const current = BENEFITS[active];
  const CurrentIcon = current.Icon;

  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="relative py-24 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        {/* LEFT — sticky intro + a live "active benefit" stage */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            {/* Frosted-glass eyebrow with a live brand-gradient dot */}
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
                Why Americell
              </AnimatedShinyText>
            </div>

            <h2
              id="why-heading"
              className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Five reasons to trust{" "}
              <AuroraText colors={BRAND_AURORA}>Americell</AuroraText>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Real US devices, live remote control, and clean residential IPs —
              built for teams that test, verify, and grow in the open.
            </p>
          </Reveal>

          {/* Live stage: mirrors whichever benefit you're scrolling through. */}
          <div aria-hidden="true" className="mt-10 hidden lg:block">
            <Reveal
              delay={0.1}
              className={cn(
                GLASS,
                "relative min-h-[16rem] overflow-hidden p-8"
              )}
            >
              <ShineBorder shineColor={STAGE_SHINE} borderWidth={1} duration={14} />

            {/* Soft brand glow for depth (decorative, static) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand/25 via-brand-2/20 to-transparent blur-3xl"
            />

            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                variants={reduced ? undefined : stageVariants}
                initial={reduced ? false : "initial"}
                animate={reduced ? undefined : "animate"}
                exit={reduced ? undefined : "exit"}
                className="absolute inset-0 flex flex-col justify-between p-8"
                style={{ willChange: "transform, opacity, filter" }}
              >
                {/* Oversized ghost number — brand watermark */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-10 right-2 select-none bg-gradient-to-br from-brand/15 to-brand-2/15 bg-clip-text text-[11rem] font-black leading-none tracking-tighter text-transparent"
                >
                  {current.num}
                </span>

                <div className="relative flex items-center gap-4">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand ring-1 ring-white/40 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(43,107,255,0.5)]">
                    <CurrentIcon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Benefit {current.num}
                  </span>
                </div>

                <h3 className="relative mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {current.title}
                </h3>
              </motion.div>
            </AnimatePresence>

            {/* Progress rail: one pip per benefit, the active one lit + widened. */}
            <div className="absolute inset-x-8 bottom-6 flex items-center gap-2">
              {BENEFITS.map((b, i) => (
                <span
                  key={b.num}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === active
                      ? "w-8 bg-gradient-to-r from-brand to-brand-2 shadow-[0_0_10px_rgba(43,107,255,0.6)]"
                      : "w-4 bg-foreground/15"
                  )}
                />
              ))}
            </div>
            </Reveal>
          </div>
        </div>

        {/* RIGHT — the benefit cards, revealed as you scroll */}
        <div ref={listRef}>
          <ol className="space-y-5 sm:space-y-6">
            {BENEFITS.map(({ num, title, body, Icon, shine, beam }, i) => (
              <motion.li
                key={num}
                variants={reduced ? undefined : cardVariants}
                initial={reduced ? false : "hidden"}
                whileInView={reduced ? undefined : "visible"}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                style={{ willChange: "transform, opacity, filter" }}
              >
                <article
                  className={cn(
                    GLASS,
                    "group relative flex flex-col overflow-hidden p-6 sm:p-8",
                    "transition-all duration-500",
                    i === active
                      ? "ring-2 ring-brand/50 shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)] lg:scale-[1.015]"
                      : "lg:scale-100"
                  )}
                >
                  {/* Animated brand accents — pure CSS/transform, GPU-friendly */}
                  <ShineBorder shineColor={shine} borderWidth={1} duration={14} />
                  {!reduced && (
                    <BorderBeam
                      size={130}
                      duration={9}
                      colorFrom={beam.from}
                      colorTo={beam.to}
                      reverse={i % 2 === 1}
                      className={cn(
                        "transition-opacity duration-500",
                        i === active ? "opacity-100" : "opacity-40"
                      )}
                    />
                  )}

                  {/* Soft brand glow blob for depth (decorative, static) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br from-brand/25 via-brand-2/20 to-transparent blur-3xl"
                  />

                  {/* Oversized ghost number — brand watermark */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-8 right-2 select-none bg-gradient-to-br from-brand/10 to-brand-2/10 bg-clip-text text-[7rem] font-black leading-none tracking-tighter text-transparent sm:text-[9rem]"
                  >
                    {num}
                  </span>

                  {/* Icon tile + benefit label */}
                  <div className="relative flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand ring-1 ring-white/40 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(43,107,255,0.5)]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Benefit {num}
                    </span>
                  </div>

                  {/* Heading + body */}
                  <div className="relative mt-6">
                    <h3 className="max-w-xl text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {title}
                    </h3>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </article>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
