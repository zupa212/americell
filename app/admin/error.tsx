"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Admin error boundary (§6.2). Fires when a server admin page throws — most
 * often a `CellgodsError` (missing/invalid API key, upstream 5xx) surfacing
 * from a `lib/cellgods` read. Renders inside the AdminNav chrome (the layout
 * gate already ran), so it only replaces the page body. Greek copy + glass, no
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
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/60 p-8 text-center backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-destructive backdrop-blur-md"
        >
          <TriangleAlert className="h-6 w-6" />
        </span>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Κάτι πήγε στραβά στη διαχείριση.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Δεν καταφέραμε να φορτώσουμε αυτή τη σελίδα. Δοκίμασε ξανά — αν το
          πρόβλημα επιμείνει, έλεγξε το κλειδί API του CellGods ή τη σύνδεση.
        </p>

        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground/70">
            Κωδικός: {error.digest}
          </p>
        ) : null}

        <Button
          size="lg"
          onClick={() => reset()}
          className="mt-6 gap-1.5 bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Δοκίμασε ξανά
        </Button>
      </div>
    </div>
  );
}
