"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Rendered when an uncaught error is thrown while
 * rendering a segment. Kept intentionally minimal (no PageShell): the shell may
 * itself be the source of the error, and error boundaries can fire before the
 * layout has mounted.
 */
export default function Error({
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
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Something went wrong.</h1>
        <p className="leading-relaxed text-muted-foreground">
          An unexpected error occurred. Try again — if the problem persists,
          get in touch with us.
        </p>
      </div>
      <Button
        size="lg"
        onClick={() => reset()}
        className="h-11 px-6 sm:h-9 sm:px-2.5"
      >
        Try again
      </Button>
    </div>
  );
}
