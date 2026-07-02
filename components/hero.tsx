import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
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
import Reveal from "@/components/ui/reveal";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Particles } from "@/components/ui/particles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hero — the marketing centerpiece (Server Component).
 *
 * No client interactivity lives here: entrance motion is delegated to the
 * shared <Reveal> client wrapper, and the floating app tiles bob via the
 * CSS keyframe utilities (animate-float / animate-float-slow) defined in
 * globals.css. The heavy lifting for premium accents is composed from
 * Magic UI + shadcn components (AuroraText, BorderBeam, ShineBorder,
 * Particles, AnimatedShinyText, ShimmerButton, Button) — each client-internal
 * where it needs to be.
 *
 * GLASSMORPHISM: the <section> is fully transparent so the persistent global
 * <SiteBackground/> (light wash + drifting aurora + dot grid, fixed behind
 * everything) shows through. Surfaces above it are frosted glass; the eyebrow
 * is a glass pill and the phone sits in a relative container carrying a
 * BorderBeam, a ShineBorder edge, a faint glass reflection, and ambient
 * <Particles/> for depth. Brand logos (react-icons/si) + a lucide gear are
 * used decoratively; all copy stays honest about real-device management,
 * automation, and testing. No network images.
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

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
        {/* frosted glass shell hosting the brand-colored chip */}
        <div className="rounded-[1.15rem] border border-white/50 bg-white/40 p-1 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.28)] ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto h-[580px] w-[286px]">
      {/* colored glow bloom behind the whole phone for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[4rem] bg-gradient-to-br from-brand/30 via-brand-2/25 to-brand-soft/30 blur-3xl"
      />
      {/* relative glass container — carries the animated BorderBeam,
          the ShineBorder edge and a faint glass reflection */}
      <div className="relative h-full w-full overflow-hidden rounded-[3rem] bg-foreground p-[10px] shadow-[0_30px_90px_-30px_rgba(43,107,255,0.45)] ring-1 ring-black/5">
        {/* faint glass reflection sweeping across the frame */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-[3rem] bg-gradient-to-tr from-transparent via-white/10 to-white/25"
        />
        {/* screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#081a44] via-[#12306e] to-[#1d4ed8]">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-3 z-20 h-7 w-[92px] -translate-x-1/2 rounded-full bg-black" />

          {/* wallpaper glow */}
          <div className="pointer-events-none absolute -top-12 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-brand-soft/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full bg-brand-2/40 blur-3xl" />

          {/* status row */}
          <div className="absolute inset-x-0 top-4 z-10 flex items-center justify-between px-7 text-[11px] font-medium text-white/85">
            <span>9:41</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="tracking-tight">5G</span>
              <span className="inline-block h-2.5 w-4 rounded-[3px] border border-white/70">
                <span className="block h-full w-2/3 rounded-[1.5px] bg-white/85" />
              </span>
            </span>
          </div>

          {/* wordmark */}
          <div className="absolute inset-x-0 top-28 flex flex-col items-center text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="7" y="2" width="10" height="20" rx="2.5" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {SITE.name}
            </p>
            <p className="mt-1 text-xs text-white/60">Αληθινή συσκευή ΗΠΑ · live</p>
          </div>

          {/* automation running glass card */}
          <div className="absolute inset-x-5 bottom-24">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-glow rounded-full bg-emerald-300" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <p className="text-xs font-medium text-white">
                  Αυτοματισμός σε εξέλιξη…
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-2/3 rounded-full bg-white/80" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/80">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30"
                  >
                    <Pause className="h-3 w-3 fill-white text-white" />
                  </span>
                  <span>Πάτα για παύση</span>
                </div>
              </div>
            </div>
          </div>

          {/* bottom "Get started" pill + send glyph */}
          <div className="absolute inset-x-5 bottom-7 flex items-center gap-2">
            <span className="flex h-9 flex-1 items-center justify-center rounded-full bg-white text-xs font-semibold text-foreground">
              Ξεκίνα τώρα
            </span>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm"
            >
              <Send className="h-4 w-4 text-white" />
            </span>
          </div>
        </div>

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
          size={140}
          duration={7}
          colorFrom="var(--color-brand, #2b6bff)"
          colorTo="var(--color-brand-2, #7c3aed)"
        />
        <BorderBeam
          size={140}
          duration={7}
          delay={3.5}
          reverse
          colorFrom="var(--color-brand-2, #7c3aed)"
          colorTo="var(--color-brand, #2b6bff)"
        />
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    // Transparent section — the global <SiteBackground/> (aurora + dot grid)
    // shows through the frosted glass surfaces above it.
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        {/* eyebrow — AnimatedShinyText inside a frosted glass pill */}
        <Reveal>
          <div className="flex justify-center">
            <div
              className={cn(
                "group rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-sm backdrop-blur-md ring-1 ring-white/40",
                "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70",
              )}
            >
              <AnimatedShinyText className="inline-flex items-center justify-center text-brand">
                Αληθινές συσκευές ΗΠΑ, πλήρως απομακρυσμένα
              </AnimatedShinyText>
            </div>
          </div>
        </Reveal>

        {/* headline — the ONLY h1 */}
        <Reveal delay={0.05}>
          <h1 className="mx-auto mt-5 max-w-4xl text-center text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            Μετατρέπουμε αληθινά τηλέφωνα ΗΠΑ σε μηχανισμό{" "}
            <AuroraText>τηλεχειρισμού</AuroraText>.
          </h1>
        </Reveal>

        {/* subhead */}
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Με το Americell μπορείς να διαχειριστείς, να αυτοματοποιήσεις και να
            ελέγξεις ένα αληθινό τηλέφωνο ΗΠΑ από οπουδήποτε, ανά πάσα στιγμή.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Link href="/signup" className="inline-flex">
              <ShimmerButton
                background="var(--foreground)"
                className="h-12 px-7 text-sm font-medium shadow-soft transition-all duration-300 hover:-translate-y-0.5"
              >
                Ξεκίνα τώρα
              </ShimmerButton>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-full px-6 text-sm font-medium text-muted-foreground transition-all duration-300 hover:-translate-y-0.5"
              render={<a href="#pricing" />}
              nativeButton={false}
            >
              Δες τις τιμές
            </Button>
          </div>
        </Reveal>

        {/* the visual: phone + floating tiles + ambient particles */}
        <Reveal delay={0.2}>
          <div className="relative mt-20 flex justify-center sm:mt-24">
            <div className="relative">
              {/* ambient particles drifting behind the phone for depth */}
              <Particles
                className="pointer-events-none absolute -inset-24 -z-10"
                quantity={70}
                ease={80}
                color="#2b6bff"
                staticity={40}
              />
              {TILES.map((tile) => (
                <FloatingTile key={tile.name} tile={tile} />
              ))}
              <PhoneMockup />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
