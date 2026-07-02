import AuroraBackground from "@/components/ui/aurora-background";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

/**
 * Persistent, full-viewport background that sits BEHIND everything (fixed, -z-10)
 * so the glassmorphism surfaces above it have a colorful, textured layer to blur.
 * A soft light base + drifting aurora blobs + a masked dot grid.
 */
export default function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f7f8fc]"
    >
      {/* soft light base wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f7fc] to-[#eef1fb]" />
      {/* colorful drifting aurora */}
      <AuroraBackground className="opacity-80" />
      {/* subtle dot grid, masked to fade out */}
      <DotPattern
        className={cn(
          "text-slate-900/[0.06]",
          "[mask-image:radial-gradient(80%_70%_at_50%_0%,black,transparent)]",
        )}
      />
    </div>
  );
}
