import AuroraBackground from "@/components/ui/aurora-background";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

/**
 * Persistent, full-viewport background that sits BEHIND everything (fixed, -z-10)
 * so the glassmorphism surfaces above it have a colorful, textured layer to blur.
 *
 * Layer stack (bottom → top):
 *   1. light near-white base wash — keeps overall luminance high so dark text
 *      on glass stays readable
 *   2. animated color wash: a slowly ROTATING conic gradient (transform) + a
 *      panning linear gradient (background-position), the whole wash gently
 *      HUE-SHIFTING (filter) — GPU-friendly, low-ish opacity, reduced-motion safe
 *   3. bold drifting aurora blobs in #2b6bff / #7c3aed / #22d3ee
 *   4. masked dot grid
 */
export default function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f5f7ff]"
    >
      {/* 1 — soft light base wash (luminance floor for readable dark text) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#eef2ff] to-[#e6ecff]" />

      {/* 2 — animated color wash, hue-shifting over the whole subtree */}
      <div className="absolute inset-0 will-change-[filter] motion-safe:animate-hue-drift">
        {/* rotating conic gradient — GPU transform; outer keeps it centered
            (static), inner spins so reduced-motion falls back cleanly */}
        <div className="absolute left-1/2 top-1/2 aspect-square w-[170vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl">
          <div className="absolute inset-0 rounded-full will-change-transform motion-safe:animate-gradient-rotate [background:conic-gradient(from_90deg_at_50%_50%,#2b6bff,#7c3aed,#22d3ee,#2b6bff)]" />
        </div>

        {/* panning linear gradient wash — GPU-cheap background-position drift */}
        <div className="absolute inset-0 bg-[length:220%_220%] opacity-[0.38] will-change-[background-position] motion-safe:animate-gradient [background-image:linear-gradient(115deg,rgba(43,107,255,0.42),rgba(124,58,237,0.46),rgba(34,211,238,0.38),rgba(43,107,255,0.42))]" />
      </div>

      {/* 3 — bold drifting aurora blobs */}
      <AuroraBackground className="opacity-95" />

      {/* extra flashy accent blobs for depth (heavily blurred, low opacity) */}
      <div
        className="absolute right-[8vw] top-[26vh] h-[36rem] w-[36rem] rounded-full bg-[#22d3ee] opacity-25 blur-[110px] will-change-transform motion-safe:animate-aurora"
        style={{ animationDelay: "-8s" }}
      />
      <div
        className="absolute bottom-[6vh] left-[26vw] h-[40rem] w-[40rem] rounded-full bg-[#7c3aed] opacity-25 blur-[110px] will-change-transform motion-safe:animate-aurora"
        style={{ animationDelay: "-3s" }}
      />

      {/* 4 — subtle dot grid, masked to fade out */}
      <DotPattern
        className={cn(
          "text-slate-900/[0.06]",
          "[mask-image:radial-gradient(80%_70%_at_50%_0%,black,transparent)]",
        )}
      />
    </div>
  );
}
