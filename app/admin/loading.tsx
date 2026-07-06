import LottiePlayer from "@/components/ui/lottie";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Glass surface matching the admin cards, so the skeleton reads as the same UI.
const glassPanel =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

/**
 * Admin loading skeleton (§6.2). Rendered inside the AdminNav chrome while a
 * server page streams: a header row, a 4-tile StatCard grid, and a table panel
 * — the shape every admin page settles into — with a centered `/lottie/loader`
 * animation floating over the table so the wait reads as "live", not frozen.
 * Server Component; the LottiePlayer child carries its own "use client".
 */
export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Header: page title + subtitle placeholders, live "loading" chip. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className={cn(glassPanel, "flex items-center gap-2.5 px-4 py-2.5")}>
          <LottiePlayer src="/lottie/loader.json" className="h-6 w-6" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading…
          </span>
        </div>
      </div>

      {/* Stat grid: 4 frosted metric tiles. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(glassPanel, "p-5")}>
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Table panel with a centered loader floating over placeholder rows. */}
      <div className={cn(glassPanel, "relative overflow-hidden p-6")}>
        {/* Toolbar: title + filter/refresh placeholders. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        {/* Placeholder rows. */}
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>

        {/* Centered live loader, floating over the skeleton rows. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/50 bg-white/70 px-8 py-6 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]">
            <LottiePlayer src="/lottie/loader.json" className="h-16 w-16" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Loading data…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
