"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, RefreshCw, TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import LottiePlayer from "@/components/ui/lottie";
import { cn } from "@/lib/utils";

/**
 * Admin error boundary (§6.2). Fires when a server admin page throws — most
 * often a `CellgodsError` (missing/invalid API key, upstream 5xx) surfacing
 * from a `lib/cellgods` read. Renders inside the AdminNav chrome (the layout
 * gate already ran), so it only replaces the page body. English copy + glass, no
 * secret details leaked — just the opaque `digest` for support.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-8 text-center backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]">
        {/* Soft red wash behind the icon so the alert reads as lit glass. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-destructive/25 via-destructive/10 to-transparent blur-2xl"
        />

        {/* Lottie pulse haloing the alert glyph. */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <LottiePlayer
            src="/lottie/pulse.json"
            className="absolute inset-0 h-20 w-20 opacity-70"
          />
          <span
            aria-hidden="true"
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/70 text-destructive backdrop-blur-md ring-1 ring-white/40"
          >
            <TriangleAlert className="h-6 w-6" />
          </span>
        </div>

        <h1 className="relative mt-4 text-xl font-bold tracking-tight text-foreground">
          Something went wrong in admin.
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t load this page. Try again — if the problem persists,
          check the CellGods API key or the connection.
        </p>

        {error.digest ? (
          <p className="relative mt-3 font-mono text-xs text-muted-foreground/70">
            Code: {error.digest}
          </p>
        ) : null}

        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            size="lg"
            onClick={() => reset()}
            className="gap-1.5 bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Link
            href="/admin"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-1.5 border-white/50 bg-white/60 backdrop-blur-md hover:bg-white/70",
            )}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
