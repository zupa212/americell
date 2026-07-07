import type { ComponentType } from "react";
import {
  Smartphone,
  MonitorSmartphone,
  Globe2,
  ShieldCheck,
  Rocket,
  type LucideProps,
} from "lucide-react";

import Reveal from "@/components/ui/reveal";
import { AuroraText } from "@/components/ui/aurora-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { BorderBeam } from "@/components/ui/border-beam";
import { ScrollStack, ScrollStackItem } from "@/components/scroll-stack";
import { cn } from "@/lib/utils";

/** Shared frosted-glass recipe, reused across every AMERICELL surface. */
const GLASS = cn(
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]"
);

/** On-brand aurora sweep for the "Americell" wordmark: blue → violet → soft blue. */
const BRAND_AURORA = ["#2b6bff", "#7c3aed", "#5aa2ff", "#2b6bff"];

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

export default function BenefitsStack() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="relative py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Section header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Why Americell
          </p>
          <h2
            id="why-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Five reasons to trust{" "}
            <AuroraText colors={BRAND_AURORA}>Americell</AuroraText>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Real US devices, live remote control, and clean residential IPs —
            built for teams that test, verify, and grow in the open.
          </p>
        </Reveal>

        {/* The stacking cards */}
        <ScrollStack className="mt-16 sm:mt-20">
          {BENEFITS.map(({ num, title, body, Icon, shine, beam }, i) => (
            <ScrollStackItem key={num}>
              <article
                className={cn(
                  GLASS,
                  "group relative flex min-h-[clamp(19rem,54vh,30rem)] w-full",
                  "flex-col justify-between overflow-hidden p-6 sm:p-12"
                )}
              >
                {/* Animated brand accents — pure CSS/transform, GPU-friendly */}
                <ShineBorder
                  shineColor={shine}
                  borderWidth={1}
                  duration={14}
                />
                <BorderBeam
                  size={140}
                  duration={9}
                  colorFrom={beam.from}
                  colorTo={beam.to}
                  reverse={i % 2 === 1}
                  className="opacity-70"
                />

                {/* Soft brand glow blob for depth (decorative, static) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand/25 via-brand-2/20 to-transparent blur-3xl"
                />

                {/* Oversized ghost number — brand watermark */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-8 right-4 select-none bg-gradient-to-br from-brand/10 to-brand-2/10 bg-clip-text text-[9rem] font-black leading-none tracking-tighter text-transparent sm:text-[12rem]"
                >
                  {num}
                </span>

                {/* Top row: icon tile + label, and the Americell wordmark */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand ring-1 ring-white/40 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(43,107,255,0.5)]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Benefit {num}
                    </span>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-white/50 bg-white/50 px-3 py-1 text-sm font-bold ring-1 ring-white/40 backdrop-blur-md">
                    <AuroraText colors={BRAND_AURORA}>Americell</AuroraText>
                  </span>
                </div>

                {/* Big heading + body */}
                <div className="relative mt-8">
                  <h3 className="max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    {title}
                  </h3>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {body}
                  </p>
                </div>
              </article>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>
    </section>
  );
}
