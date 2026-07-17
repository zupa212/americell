"use client";

import type { ComponentType, SVGProps } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import {
  SiInstagram,
  SiTiktok,
  SiX,
  SiSnapchat,
  SiTinder,
  SiReddit,
  SiTelegram,
} from "react-icons/si";
import { Settings, Pause, Send } from "lucide-react";
import { SITE } from "@/lib/site";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Particles } from "@/components/ui/particles";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Button } from "@/components/ui/button";
import HeroPhoneParallax from "@/components/hero-phone-parallax";
import { cn } from "@/lib/utils";

/**
 * Hero — the marketing centerpiece (Client Component). THE STAR.
 *
 * The entrance is a single, coordinated, buttery stagger driven by Framer
 * Motion variants (motion/react): the eyebrow → headline → subline → CTAs →
 * trust row → device visual draw in one at a time on mount, each fading up
 * from y+24 while a 6px blur dissolves (ease [0.16,1,0.3,1]). Because the hero
 * sits above the fold we play on mount (initial → animate) rather than
 * whileInView, which reads as more premium here. Everything honors
 * prefers-reduced-motion by rendering perfectly static.
 *
 * Depth comes from three transform-only layers that never touch layout:
 *   • the headline's brand bloom drifts with a small scroll parallax
 *     (useScroll + useTransform, ~30px)
 *   • the phone gets its own scroll parallax + idle float via the tiny
 *     <HeroPhoneParallax> client child (so it moves relative to the app tiles)
 *   • the floating app tiles bob on the CSS float keyframes from globals.css
 *
 * Flashy · minimal · BOLD (US-English): a huge headline built on the
 * "your servers moved to the cloud, your phone fleet is next" thesis with an
 * animated blue→violet→cyan AuroraText keyword, the enterprise one-liner as
 * subcopy, a ShimmerButton "Deploy your fleet" (/signup) + a subtle glass
 * "Talk to Sales" (/contact), an honest trust row, and a noticeably BIGGER,
 * premium phone mockup drawn in its native 286×580 coordinate system then
 * scaled up so the floating tiles stay anchored.
 *
 * GLASSMORPHISM: the <section> is fully transparent so the persistent global
 * <SiteBackground/> (light wash + drifting aurora + dot grid, fixed behind
 * everything) shows through. Surfaces above it are frosted glass. The premium
 * accents are composed from Magic UI + shadcn (AuroraText, AnimatedShinyText,
 * ShimmerButton, Particles, DotPattern, BorderBeam, ShineBorder, Button).
 * Brand logos (react-icons/si) + a lucide gear are decorative; all copy stays
 * honest about real-device control, automation, and testing. No network images.
 */

// Signature easing + a coordinated stagger for the whole hero entrance.
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.62,
      ease: EASE_OUT,
      filter: { duration: 0.5, ease: "easeOut" },
    },
  },
};

// Snappy spring for CTA / eyebrow micro-interactions.
const PRESS_SPRING = { type: "spring", stiffness: 400, damping: 17 } as const;

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** The Americell mark — a phone silhouette with a signal notch. */
function BrandGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

type FloatingTile = {
  name: string;
  Icon: IconType;
  /** brand-colored gradient stops, applied inline */
  from: string;
  to: string;
  /** tailwind position classes locating the tile around the phone */
  position: string;
  /** float vs float-slow for varied tempo */
  anim: "animate-float" | "animate-float-slow";
  /** negative delay (s) to desync the bob phase */
  delay: string;
  /** hide on small screens to keep the layout calm */
  hideOnMobile?: boolean;
};

// Scatter ~8 tiles around the phone — some left, some right, varied vertical
// offsets and animation phases. The phone lives in a relative box; tiles are
// positioned absolutely against it.
const TILES: FloatingTile[] = [
  {
    name: "Instagram",
    Icon: SiInstagram,
    from: "#f9ce34",
    to: "#ee2a7b",
    position: "-left-16 top-4 sm:-left-24",
    anim: "animate-float",
    delay: "-0.2s",
  },
  {
    name: "TikTok",
    Icon: SiTiktok,
    from: "#25f4ee",
    to: "#0f0f0f",
    position: "-right-16 top-0 sm:-right-24",
    anim: "animate-float-slow",
    delay: "-1.4s",
  },
  {
    name: "X",
    Icon: SiX,
    from: "#3a3a3c",
    to: "#0a0a0a",
    position: "-left-28 top-40 sm:-left-40",
    anim: "animate-float-slow",
    delay: "-0.8s",
    hideOnMobile: true,
  },
  {
    name: "Snapchat",
    Icon: SiSnapchat,
    from: "#fffc00",
    to: "#f4d000",
    position: "-right-28 top-44 sm:-right-40",
    anim: "animate-float",
    delay: "-2.1s",
    hideOnMobile: true,
  },
  {
    name: "Telegram",
    Icon: SiTelegram,
    from: "#37bbfe",
    to: "#007dbb",
    position: "-left-14 bottom-28 sm:-left-20",
    anim: "animate-float",
    delay: "-1.1s",
  },
  {
    name: "Reddit",
    Icon: SiReddit,
    from: "#ff7a3d",
    to: "#ff4500",
    position: "-right-14 bottom-32 sm:-right-20",
    anim: "animate-float-slow",
    delay: "-0.5s",
  },
  {
    name: "Tinder",
    Icon: SiTinder,
    from: "#ff7854",
    to: "#fd267d",
    position: "-left-24 bottom-4 sm:-left-36",
    anim: "animate-float-slow",
    delay: "-1.8s",
    hideOnMobile: true,
  },
  {
    name: "Settings",
    Icon: Settings,
    from: "#c7ccd4",
    to: "#8b909a",
    position: "-right-24 bottom-6 sm:-right-36",
    anim: "animate-float",
    delay: "-2.6s",
    hideOnMobile: true,
  },
];

function FloatingTile({ tile }: { tile: FloatingTile }) {
  const { name, Icon, from, to, position, anim, delay, hideOnMobile } = tile;
  const gradient = `linear-gradient(135deg, ${from}, ${to})`;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute z-10",
        position,
        anim,
        hideOnMobile && "hidden md:block",
      )}
      style={{ animationDelay: delay }}
    >
      <div className="group relative">
        {/* blurred color glow behind the tile — richer + hover bloom */}
        <div
          className="absolute inset-0 -z-10 rounded-2xl opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: gradient }}
        />
        {/* frosted glass shell hosting the brand-colored chip.
            The shell both animates (animate-float) AND uses backdrop-blur, the
            costliest combo during a mobile scroll, so the blur is lightened on
            phones (<=640px) while the desktop look is preserved at sm+. */}
        <div className="rounded-[1.15rem] border border-white/50 bg-white/40 p-1 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.28)] ring-1 ring-white/40 backdrop-blur-md max-sm:backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-black/20 ring-1 ring-white/30 sm:h-14 sm:w-14"
            style={{ background: gradient }}
            title={name}
          >
            <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PhoneMockup — a pure-CSS, Apple-grade device, scaled up.
 *
 * It draws in a native 286×580 coordinate system so every meticulously
 * calibrated offset (side buttons, Dynamic Island, status bar, glass card…)
 * stays exact — then a single `origin-top-left scale-[1.15]` transform makes the
 * whole thing NOTICEABLY BIGGER. The outer box is pre-sized to the scaled
 * footprint (329×667) so the floating app tiles keep their anchoring.
 *
 * The realism is layered, back-to-front:
 *   • a soft contact shadow grounding the device
 *   • a colored brand bloom for depth
 *   • sculpted side buttons (action / volume / power) tucked under the rail
 *   • a polished chamfer rim → brushed titanium rail (edge gradient + specular
 *     sheen + inset bevels) → hairline black bezel → the screen
 *   • a rich radial dark-blue wallpaper with brand glow + vignette
 *   • an accurate Dynamic Island with a camera lens
 *   • a crisp status bar (signal · 5G · Wi-Fi · battery)
 *   • the frosted "Automation running…" glass card + CTA pill
 *   • a glossy front-glass reflection sweeping the whole face
 *
 * The animated ShineBorder + dual BorderBeam still trace the metal edge.
 */
function PhoneMockup({ singleBeam = false }: { singleBeam?: boolean }) {
  // Brushed titanium rail — a cross-band gradient reads as a rounded metal
  // edge catching light on both sides with a darker core.
  const titanium =
    "linear-gradient(140deg, #e6e8ec 0%, #b2b6bf 14%, #83878f 30%, #595c63 46%, #6d7079 55%, #9fa3ab 72%, #cdd0d6 88%, #edeff2 100%)";
  // Inset bevels give the rail thickness and a lit top / shadowed bottom.
  const railBevels =
    "inset 0 1.5px 1px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.5), inset 2px 0 3px rgba(255,255,255,0.22), inset -2px 0 3px rgba(0,0,0,0.35)";
  // A polished 1.4px chamfer catching a hard highlight.
  const chamfer =
    "linear-gradient(150deg, rgba(255,255,255,0.95) 0%, rgba(215,218,224,0.6) 20%, rgba(120,124,133,0.5) 50%, rgba(70,73,80,0.6) 72%, rgba(205,208,214,0.75) 100%)";
  // Rich, deep dark-blue wallpaper with a soft glow spilling from the top.
  const wallpaper =
    "radial-gradient(130% 90% at 50% -20%, #1c3d80 0%, #14306a 30%, #0b1e4c 58%, #060f30 100%)";

  return (
    // Outer box pre-sized to the SCALED footprint (286×1.15, 580×1.15) so the
    // absolutely-positioned floating tiles anchor around the bigger device.
    <div className="relative mx-auto h-[667px] w-[329px]">
      {/* native 286×580 canvas, scaled up from the top-left corner */}
      <div className="relative h-[580px] w-[286px] origin-top-left scale-[1.15]">
        {/* colored glow bloom behind the whole phone for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-10 -z-20 rounded-[4rem] bg-gradient-to-br from-brand/40 via-brand-2/30 to-brand-soft/40 blur-3xl"
        />
        {/* soft contact shadow grounding the device */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 left-1/2 -z-10 h-16 w-[82%] -translate-x-1/2 rounded-[50%] bg-black/45 blur-2xl"
        />

        {/* sculpted side buttons — tucked half under the rail so only a
            machined sliver shows (drawn before the body so the frame overlaps) */}
        <span
          aria-hidden="true"
          className="absolute -left-[3px] top-[128px] z-0 h-[26px] w-[5px] rounded-l-[3px] shadow-[-1px_0_2px_rgba(0,0,0,0.35)]"
          style={{ backgroundImage: "linear-gradient(90deg,#d4d7dd,#9297a0 55%,#5c6069)" }}
        />
        <span
          aria-hidden="true"
          className="absolute -left-[3px] top-[176px] z-0 h-[44px] w-[5px] rounded-l-[3px] shadow-[-1px_0_2px_rgba(0,0,0,0.35)]"
          style={{ backgroundImage: "linear-gradient(90deg,#d4d7dd,#9297a0 55%,#5c6069)" }}
        />
        <span
          aria-hidden="true"
          className="absolute -left-[3px] top-[230px] z-0 h-[44px] w-[5px] rounded-l-[3px] shadow-[-1px_0_2px_rgba(0,0,0,0.35)]"
          style={{ backgroundImage: "linear-gradient(90deg,#d4d7dd,#9297a0 55%,#5c6069)" }}
        />
        <span
          aria-hidden="true"
          className="absolute -right-[3px] top-[198px] z-0 h-[72px] w-[5px] rounded-r-[3px] shadow-[1px_0_2px_rgba(0,0,0,0.35)]"
          style={{ backgroundImage: "linear-gradient(270deg,#d4d7dd,#9297a0 55%,#5c6069)" }}
        />

        {/* device body — polished chamfer rim wrapping the titanium rail */}
        <div
          className="relative z-10 h-full w-full rounded-[3.05rem] p-[1.4px] shadow-[0_40px_100px_-30px_rgba(43,107,255,0.55),0_18px_44px_-18px_rgba(0,0,0,0.6)]"
          style={{ backgroundImage: chamfer }}
        >
          {/* brushed titanium rail — hosts the screen, sheen, ShineBorder + beams */}
          <div
            className="relative h-full w-full overflow-hidden rounded-[3rem] p-[9px]"
            style={{ backgroundImage: titanium, boxShadow: railBevels }}
          >
            {/* specular sheen streaking across the metal */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 rounded-[3rem]"
              style={{
                backgroundImage:
                  "linear-gradient(140deg, transparent 38%, rgba(255,255,255,0.4) 48%, transparent 58%)",
              }}
            />

            {/* hairline black bezel between metal and glass */}
            <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-black p-[2px] shadow-[inset_0_0_2px_1px_rgba(0,0,0,0.9)]">
              {/* screen */}
              <div
                className="relative h-full w-full overflow-hidden rounded-[2.4rem]"
                style={{ backgroundImage: wallpaper }}
              >
                {/* wallpaper brand glow */}
                <div className="pointer-events-none absolute -top-12 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-brand-soft/50 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full bg-brand-2/40 blur-3xl" />
                {/* screen vignette for depth */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[2.4rem] shadow-[inset_0_0_50px_16px_rgba(3,8,26,0.55)]"
                />
                {/* soft in-glass sheen (behind the UI, keeps copy crisp) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[2.4rem]"
                  style={{
                    backgroundImage:
                      "linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 22%, transparent 46%)",
                  }}
                />

                {/* dynamic island */}
                <div className="absolute left-1/2 top-[11px] z-30 flex h-[30px] w-[98px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_2px_6px_rgba(0,0,0,0.5)] ring-1 ring-black/70">
                  {/* camera lens with a faint blue catch-light */}
                  <span
                    className="relative h-[11px] w-[11px] rounded-full ring-1 ring-white/10"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 32% 30%, #223a63 0%, #0a1224 55%, #000 100%)",
                    }}
                  >
                    <span className="absolute left-[2px] top-[1.5px] h-[3px] w-[3px] rounded-full bg-sky-300/60 blur-[0.5px]" />
                  </span>
                </div>

                {/* status row */}
                <div className="absolute inset-x-0 top-[14px] z-20 flex items-center justify-between px-6 text-white">
                  <span className="text-[13px] font-semibold tracking-tight">
                    9:41
                  </span>
                  <span className="flex items-center gap-1.5" aria-hidden="true">
                    {/* signal bars */}
                    <span className="flex items-end gap-[2px]">
                      <span className="h-[5px] w-[3px] rounded-[1px] bg-white/90" />
                      <span className="h-[7px] w-[3px] rounded-[1px] bg-white/90" />
                      <span className="h-[9px] w-[3px] rounded-[1px] bg-white/90" />
                      <span className="h-[11px] w-[3px] rounded-[1px] bg-white/40" />
                    </span>
                    <span className="text-[11px] font-semibold tracking-tight">
                      5G
                    </span>
                    {/* wi-fi */}
                    <svg
                      viewBox="0 0 16 12"
                      className="h-3 w-3.5 text-white/90"
                      fill="currentColor"
                    >
                      <path d="M8 9.4a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM8 5.1c1.75 0 3.35.68 4.55 1.9l1.32-1.42A8.4 8.4 0 008 3.1a8.4 8.4 0 00-5.87 2.48L3.45 7A6.55 6.55 0 018 5.1zM8 0C4.94 0 2.16 1.17.08 3.24l1.32 1.42A9.7 9.7 0 018 2.02c2.6 0 4.98.98 6.6 2.64l1.32-1.42A11.75 11.75 0 008 0z" />
                    </svg>
                    {/* battery */}
                    <span className="relative flex h-[11px] w-[22px] items-center">
                      <span className="absolute inset-0 rounded-[3px] border border-white/50" />
                      <span className="absolute -right-[3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r-[1px] bg-white/50" />
                      <span className="absolute left-[1.5px] top-1/2 h-[6px] w-[13px] -translate-y-1/2 rounded-[1.5px] bg-white/90" />
                    </span>
                  </span>
                </div>

                {/* wordmark */}
                <div className="absolute inset-x-0 top-28 flex flex-col items-center text-white">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-white/25 backdrop-blur-sm">
                    <BrandGlyph className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight">
                    {SITE.name}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Real US device · live
                  </p>
                </div>

                {/* live session glass card */}
                <div className="absolute inset-x-5 bottom-24">
                  <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-[0_10px_34px_-10px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-glow rounded-full bg-emerald-300" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      </span>
                      <p className="text-xs font-medium text-white">
                        Live session · streaming
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/20">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400" />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/80">
                        <span
                          aria-hidden="true"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30"
                        >
                          <Pause className="h-3 w-3 fill-white text-white" />
                        </span>
                        <span>Tap to pause</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* bottom "Get started" pill + send glyph */}
                <div className="absolute inset-x-5 bottom-7 flex items-center gap-2">
                  <span className="flex h-9 flex-1 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#0b1020] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]">
                    Get started
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </span>
                </div>

                {/* home indicator */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-1/2 h-1 w-[100px] -translate-x-1/2 rounded-full bg-white/40"
                />
              </div>
            </div>

            {/* glossy front-glass reflection sweeping the whole face */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-40 rounded-[3rem]"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 14%, transparent 34%, transparent 66%, rgba(255,255,255,0.04) 84%, rgba(255,255,255,0.14) 100%)",
              }}
            />

            {/* shimmering glass edge tracing the frame */}
            <ShineBorder
              borderWidth={2}
              duration={12}
              shineColor={[
                "var(--color-brand, #2b6bff)",
                "var(--color-brand-2, #7c3aed)",
                "var(--color-brand-soft, #60a5fa)",
              ]}
              className="rounded-[3rem]"
            />

            {/* animated border beam tracing the phone frame */}
            <BorderBeam
              size={150}
              duration={7}
              colorFrom="var(--color-brand, #2b6bff)"
              colorTo="var(--color-brand-2, #7c3aed)"
            />
            {/* Second, counter-rotating beam is desktop-only: on phones we run
                a single beam to halve the always-on motion/paint work while
                keeping the animated edge. */}
            {!singleBeam && (
              <BorderBeam
                size={150}
                duration={7}
                delay={3.5}
                reverse
                colorFrom="var(--color-brand-2, #7c3aed)"
                colorTo="var(--color-brand, #2b6bff)"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Trust line — honest, no-commitment highlights for the trust row.
const TRUST_POINTS = [
  "No setup fees",
  "Cancel anytime",
  "Live in minutes",
  "Transparent per-device pricing",
];

/**
 * SSR-safe mobile gate. Defaults to the full desktop experience during SSR and
 * first paint (preserving the desktop identity and keeping hydration in sync),
 * then downgrades on phones / coarse-pointer devices after mount. Used here to
 * thin out the ambient particles, drop the second border beam, and freeze the
 * scroll-linked bloom parallax on mobile.
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mq = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/**
 * Pause decorative CSS animations when their container scrolls out of view or
 * the tab is hidden. Defaults to running so the above-the-fold visual animates
 * on mount with no hydration mismatch; flips off (via IntersectionObserver +
 * visibilitychange) so the floating tiles / status glow don't keep repainting
 * behind the fold or in a backgrounded tab.
 */
function useInViewActive<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (typeof window === "undefined" || !el) return;
    let inView = true;
    let visible =
      typeof document === "undefined" || document.visibilityState !== "hidden";
    const sync = () => setActive(inView && visible);
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? true;
              sync();
            },
            { rootMargin: "200px" },
          )
        : null;
    io?.observe(el);
    const onVisibility = () => {
      visible = document.visibilityState !== "hidden";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return [ref, active] as const;
}

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [visualRef, visualActive] = useInViewActive<HTMLDivElement>();

  // Small scroll-linked parallax for the headline's brand bloom (transform
  // only). The phone gets its own parallax inside <HeroPhoneParallax>.
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bloomY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  // Motion props are gated on reduced-motion: when reduced, spreads are empty
  // objects so every element renders static and fully visible.
  const container = prefersReducedMotion
    ? {}
    : { variants: containerVariants, initial: "hidden", animate: "show" };
  const item = prefersReducedMotion ? {} : { variants: itemVariants };
  const press = prefersReducedMotion
    ? {}
    : {
        whileHover: { scale: 1.03 },
        whileTap: { scale: 0.97 },
        transition: PRESS_SPRING,
      };

  return (
    // Transparent section — the global <SiteBackground/> (aurora + dot grid)
    // shows through the frosted glass surfaces above it.
    <section ref={sectionRef} id="top" className="relative overflow-hidden">
      {/* soft brand-gradient glow behind the headline — keeps AMERICELL's
          blue→violet presence felt without overpowering the global aurora.
          Drifts up gently on scroll for depth (transform only). */}
      <motion.div
        aria-hidden="true"
        style={
          prefersReducedMotion || isMobile
            ? undefined
            : { y: bloomY, willChange: "transform" }
        }
        className="pointer-events-none absolute inset-x-0 -top-20 -z-10 flex justify-center"
      >
        <div className="h-[440px] w-[860px] max-w-[92vw] rounded-full bg-[radial-gradient(closest-side,rgba(43,107,255,0.20),rgba(124,58,237,0.12),transparent)] blur-2xl" />
      </motion.div>

      <motion.div
        {...container}
        className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-32"
      >
        {/* eyebrow — AMERICELL brand mark + AnimatedShinyText inside a
            crisp frosted glass pill */}
        <motion.div {...item} className="flex justify-center">
          <motion.div
            {...press}
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3.5 text-sm",
              "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
              "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
              "transition-colors duration-300 hover:bg-white/70",
            )}
          >
            {/* small Americell brand mark */}
            <span className="flex items-center gap-1.5 rounded-full bg-white/70 py-1 pl-1 pr-2.5 ring-1 ring-white/50">
              <span className="flex h-5 w-5 items-center justify-center rounded-[7px] bg-gradient-to-br from-brand via-brand-2 to-brand-soft shadow-sm ring-1 ring-white/40">
                <BrandGlyph className="h-3 w-3 text-white" />
              </span>
              <AuroraText className="text-[13px] font-semibold tracking-tight">
                {SITE.name}
              </AuroraText>
            </span>
            <span aria-hidden="true" className="h-3.5 w-px bg-foreground/15" />
            <AnimatedShinyText className="inline-flex items-center justify-center text-brand">
              Remote phone infrastructure
            </AnimatedShinyText>
          </motion.div>
        </motion.div>

        {/* headline — the ONLY h1 */}
        <motion.h1
          {...item}
          className="mx-auto mt-8 max-w-5xl text-balance break-words text-center text-4xl font-bold leading-[0.95] tracking-[-0.045em] text-foreground sm:text-7xl sm:leading-[0.92] lg:text-[6.5rem]"
        >
          You moved your servers to the cloud.{" "}
          <br className="hidden sm:block" />
          Your phone{" "}
          <AuroraText colors={["#2b6bff", "#7c3aed", "#22d3ee"]} speed={1.2}>
            fleet
          </AuroraText>{" "}
          is next.
        </motion.h1>

        {/* subhead */}
        <motion.p
          {...item}
          className="mx-auto mt-7 max-w-2xl text-pretty text-center text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          {SITE.name} is remote phone infrastructure for teams that need real,
          physical iPhones and Androids in the cloud — not emulators. We host,
          power, and maintain the fleet. You keep full control from one
          dashboard, on your laptop or phone — no office hardware, no cables,
          no babysitting.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...item}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
        >
          <motion.div {...press} className="inline-flex">
            <Link
              href="/signup"
              className="inline-flex"
              aria-label="Deploy your fleet"
            >
              <ShimmerButton
                background="linear-gradient(110deg, #2b6bff 0%, #7c3aed 45%, #5aa2ff 100%)"
                shimmerColor="#ffffff"
                className="h-12 px-7 text-sm font-semibold text-white shadow-soft ring-1 ring-white/25"
              >
                Deploy your fleet
              </ShimmerButton>
            </Link>
          </motion.div>
          <motion.div {...press} className="inline-flex">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-full border border-white/20 px-6 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
              render={<a href="/contact" />}
              nativeButton={false}
            >
              Talk to Sales
            </Button>
          </motion.div>
        </motion.div>

        {/* trust row — honest product highlights */}
        <motion.ul
          {...item}
          aria-label="Product highlights"
          className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-2.5"
        >
          {TRUST_POINTS.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/50 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-white/40 backdrop-blur-md"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand to-brand-2"
              />
              {point}
            </li>
          ))}
        </motion.ul>

        {/* the visual: phone + floating tiles + ambient particles / dots */}
        <motion.div
          {...item}
          className="relative mt-20 flex justify-center sm:mt-28"
        >
          <div
            ref={visualRef}
            className={cn(
              "relative origin-top scale-[0.8] -mb-24 sm:mb-0 sm:scale-100",
              // Freeze the tile bob + status glow when the visual leaves the
              // viewport or the tab is hidden (transform/opacity only — no
              // layout thrash). BorderBeam/ShineBorder pause in their own files.
              !visualActive &&
                "[&_.animate-float]:[animation-play-state:paused] [&_.animate-float-slow]:[animation-play-state:paused] [&_.animate-glow]:[animation-play-state:paused]",
            )}
          >
            {/* subtle dot grid behind the device, softly masked to the center */}
            {/* Decorative dot grid — desktop only; the motion.circle grid is
                skipped on mobile where paint budget is tight. */}
            <DotPattern
              width={24}
              height={24}
              cr={1.1}
              className="pointer-events-none -z-20 hidden text-brand/20 [mask-image:radial-gradient(280px_circle_at_50%_45%,white,transparent_72%)] sm:block"
            />
            {/* ambient particles drifting behind the phone for depth */}
            <Particles
              className="pointer-events-none absolute -inset-24 -z-10"
              quantity={isMobile ? 24 : 70}
              ease={80}
              color="#2b6bff"
              staticity={40}
            />
            {TILES.map((tile) => (
              <FloatingTile key={tile.name} tile={tile} />
            ))}
            {/* subtle scroll parallax + idle float (reduced-motion safe) */}
            <HeroPhoneParallax>
              <PhoneMockup singleBeam={isMobile} />
            </HeroPhoneParallax>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
