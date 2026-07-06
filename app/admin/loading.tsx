import { Skeleton } from "@/components/ui/skeleton";

// Glass surface matching the admin cards, so the skeleton reads as the same UI.
const glassPanel =
  "rounded-3xl border border-white/50 bg-white/60 p-5 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

/**
 * Admin loading skeleton (§6.2). Rendered inside the AdminNav chrome while a
 * server page streams: a heading, a 4-tile StatCard row, and a table panel —
 * the shape every admin page settles into.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={glassPanel}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className={glassPanel.replace("p-5", "p-6")}>
        <Skeleton className="h-5 w-44" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
