import { cn } from "@/lib/cn";

type AuroraBackgroundProps = {
  className?: string;
};

/**
 * Decorative aurora layer: soft, blurred gradient blobs in blue (#2b6bff),
 * violet (#7c3aed) and cyan. Pure CSS, no JS, aria-hidden. Render behind a hero
 * (prominent) or a section (subtle) — the parent should be relative + clip.
 *
 * PERFORMANCE (cross-device smoothness): on mobile only the two primary blobs
 * render, with a lighter blur, NO animation and NO will-change — a calm, mostly
 * static wash. The heavy path (four blobs, blur-3xl, drifting, promoted layers)
 * is gated to sm+ where desktops/tablets handle it. Honors reduced motion, so a
 * phone never ticks four full-screen blur-3xl compositor layers every frame.
 */
export default function AuroraBackground({ className }: AuroraBackgroundProps) {
  // Base blob: mobile = static + lighter blur + no will-change; sm+ = drift.
  const blob =
    "absolute rounded-full opacity-30 blur-2xl sm:blur-3xl sm:animate-aurora sm:will-change-transform motion-reduce:animate-none";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* blue — top-left (always) */}
      <div
        className={cn(blob, "-left-[10vw] -top-[18rem] h-[42rem] w-[42rem] bg-brand")}
        style={{ animationDelay: "0s" }}
      />
      {/* violet — top-right (always) */}
      <div
        className={cn(blob, "-right-[8vw] -top-[10rem] h-[38rem] w-[38rem] bg-brand-2")}
        style={{ animationDelay: "-6s" }}
      />
      {/* cyan — center/bottom drift (desktop only) */}
      <div
        className={cn(
          blob,
          "hidden opacity-25 sm:block left-[28vw] top-[16rem] h-[34rem] w-[34rem] bg-cyan-400",
        )}
        style={{ animationDelay: "-11s" }}
      />
      {/* soft violet — bottom-left accent (desktop only) */}
      <div
        className={cn(
          blob,
          "hidden opacity-25 sm:block -bottom-[16rem] left-[6vw] h-[30rem] w-[30rem] bg-brand-soft",
        )}
        style={{ animationDelay: "-14s" }}
      />
    </div>
  );
}
