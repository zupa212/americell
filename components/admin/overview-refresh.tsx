"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RelativeTime } from "@/components/admin/relative-time";
import { cn } from "@/lib/utils";

/**
 * OverviewRefreshButton — re-runs the (force-dynamic) admin overview Server
 * Component via `router.refresh()`, re-fetching the live CellGods balance/orders
 * /inventory and the DB KPIs without a full navigation. `useTransition` keeps the
 * button responsive and spins the glyph while the RSC payload streams back.
 *
 * `generatedAt` is stamped by the server on each render, so the tooltip shows a
 * live "updated N seconds ago" that resets on every successful refresh.
 */
export default function OverviewRefreshButton({
  generatedAt,
}: {
  /** ISO timestamp of the current server render. */
  generatedAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              onClick={() => startTransition(() => router.refresh())}
              disabled={pending}
              aria-label="Refresh live data"
              className="gap-2 border-white/50 bg-white/60 backdrop-blur-md hover:bg-white/75"
            />
          }
        >
          <RotateCcw
            className={cn("h-4 w-4", pending && "animate-spin")}
            aria-hidden="true"
          />
          <span>{pending ? "Refreshing…" : "Refresh"}</span>
        </TooltipTrigger>
        <TooltipContent>
          Updated <RelativeTime date={generatedAt} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
