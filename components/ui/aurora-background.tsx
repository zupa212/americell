import { cn } from "@/lib/cn";

type AuroraBackgroundProps = {
  className?: string;
};

/**
 * Decorative aurora layer: 3–4 large, soft, BLURRED gradient blobs in
 * blue (#2b6bff), violet (#7c3aed) and cyan (#22d3ee). Low opacity,
 * gently drifting (animate-aurora with varied delays). Pure CSS, no JS,
 * aria-hidden. Render behind a hero (prominent) or a section (subtle)
 * — the parent should be relative and clip overflow.
 */
export default function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* blue — top-left */}
      <div
        className="animate-aurora absolute -left-[10vw] -top-[18rem] h-[42rem] w-[42rem] rounded-full bg-brand opacity-30 blur-3xl will-change-transform"
        style={{ animationDelay: "0s" }}
      />
      {/* violet — top-right */}
      <div
        className="animate-aurora absolute -right-[8vw] -top-[10rem] h-[38rem] w-[38rem] rounded-full bg-brand-2 opacity-30 blur-3xl will-change-transform"
        style={{ animationDelay: "-6s" }}
      />
      {/* cyan — center/bottom drift */}
      <div
        className="animate-aurora absolute left-[28vw] top-[16rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400 opacity-25 blur-3xl will-change-transform"
        style={{ animationDelay: "-11s" }}
      />
      {/* soft violet — bottom-left accent */}
      <div
        className="animate-aurora absolute -bottom-[16rem] left-[6vw] h-[30rem] w-[30rem] rounded-full bg-brand-soft opacity-25 blur-3xl will-change-transform"
        style={{ animationDelay: "-14s" }}
      />
    </div>
  );
}
