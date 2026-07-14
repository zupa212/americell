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
 *
 * Cross-device budget (pure CSS, stays a Server Component — zero hydration):
 * every animator is gated with `sm:` so it only runs at >=640px (full desktop
 * identity) and mobile (<640px) gets a lighter, mostly-static wash. On phones we
 * drop the paint-bound animations — the whole-subtree `hue-drift` (filter), the
 * `gradient-pan` (background-position), and the conic `gradient-rotate` (its blur
 * re-samples the spinning child every frame) — keep only cheap static colour for
 * depth, lighten blur radii, shed one accent blob, and remove every `will-change`
 * so these huge blurred layers never sit resident in mid/low-end GPU memory.
 * Reduced-motion is already handled by the `motion-safe:` variants.
 */
export default function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f5f7ff]"
    >
      {/* 1 — soft light base wash (luminance floor for readable dark text) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#eef2ff] to-[#e6ecff]" />

      {/* 2 — animated color wash, hue-shifting over the whole subtree.
          The filter hue-drift repaints the subtree every frame, so it (and its
          will-change) is gated to >=640px; phones keep the wash but static. */}
      <div className="absolute inset-0 sm:will-change-[filter] sm:motion-safe:animate-hue-drift">
        {/* rotating conic gradient — GPU transform; outer keeps it centered
            (static), inner spins so reduced-motion falls back cleanly. On mobile
            the spin is off (its parent blur would re-sample every frame) and the
            blur is lighter, so it renders once as a cheap static colour field. */}
        <div className="absolute left-1/2 top-1/2 aspect-square w-[170vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-2xl sm:blur-3xl">
          <div className="absolute inset-0 rounded-full sm:will-change-transform sm:motion-safe:animate-gradient-rotate [background:conic-gradient(from_90deg_at_50%_50%,#2b6bff,#7c3aed,#22d3ee,#2b6bff)]" />
        </div>

        {/* panning linear gradient wash — background-position repaints per frame,
            so the pan + will-change run only at >=640px; mobile keeps it static */}
        <div className="absolute inset-0 bg-[length:220%_220%] opacity-[0.38] sm:will-change-[background-position] sm:motion-safe:animate-gradient [background-image:linear-gradient(115deg,rgba(43,107,255,0.42),rgba(124,58,237,0.46),rgba(34,211,238,0.38),rgba(43,107,255,0.42))]" />
      </div>

      {/* 3 — bold drifting aurora blobs */}
      <AuroraBackground className="opacity-95" />

      {/* extra flashy accent blobs for depth (heavily blurred, low opacity).
          Transform-drift + will-change only >=640px; mobile keeps this one static
          with a lighter blur (no resident compositor layer). */}
      <div
        className="absolute right-[8vw] top-[26vh] h-[36rem] w-[36rem] rounded-full bg-[#22d3ee] opacity-25 blur-[70px] sm:blur-[110px] sm:will-change-transform sm:motion-safe:animate-aurora"
        style={{ animationDelay: "-8s" }}
      />
      {/* second accent blob dropped entirely on mobile — fewer aurora layers */}
      <div
        className="absolute bottom-[6vh] left-[26vw] hidden h-[40rem] w-[40rem] rounded-full bg-[#7c3aed] opacity-25 blur-[110px] will-change-transform motion-safe:animate-aurora sm:block"
        style={{ animationDelay: "-3s" }}
      />

      {/* 4 — subtle dot grid, masked to fade out (desktop only; the motion.circle
          grid is skipped on mobile to protect the paint budget) */}
      <DotPattern
        className={cn(
          "hidden text-slate-900/[0.06] sm:block",
          "[mask-image:radial-gradient(80%_70%_at_50%_0%,black,transparent)]",
        )}
      />
    </div>
  );
}
