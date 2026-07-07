import type { ReactNode } from "react";
import Link from "next/link";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

/**
 * Editorial BLACK & WHITE shell for every page under `/blog`.
 *
 * The marketing site is intentionally colorful glassmorphism floating over a
 * global animated aurora (see `components/site-background.tsx`, fixed at -z-10).
 * The blog is the deliberate opposite: a premium, typography-first, monochrome
 * reading environment — think Apple Newsroom or a print magazine.
 *
 * To achieve that here we paint an OPAQUE near-white surface (`bg-neutral-50`)
 * across the full min-h-screen. Sitting in normal flow (z-index auto), it fully
 * covers the fixed aurora underneath — no glass, no backdrop-blur, no brand
 * gradient, no AuroraText. This layout is what makes the blog monochrome.
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  const chrome = "mx-auto w-full max-w-5xl px-5 sm:px-6";
  const focus =
    "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50";

  return (
    <div
      className={cn(
        // Opaque near-white surface that COVERS the global colorful aurora.
        "relative z-0 flex min-h-screen flex-col",
        "bg-neutral-50 text-neutral-900 antialiased",
      )}
    >
      {/* Minimal sticky monochrome header — opaque, black hairline underline. */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-neutral-50">
        <div className={cn(chrome, "flex h-16 items-center justify-between")}>
          <div className="flex items-center gap-3">
            {/* Plain BOLD BLACK wordmark — no gradient, no AuroraText. */}
            <Link
              href="/"
              aria-label={`${SITE.name} — home`}
              className={cn(
                "text-lg font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-70",
                focus,
              )}
            >
              {SITE.name}
            </Link>
            <span
              aria-hidden="true"
              className="hidden h-5 w-px bg-neutral-300 sm:block"
            />
            <span className="text-sm font-medium tracking-wide text-neutral-500">
              Blog
            </span>
          </div>

          <Link
            href="/"
            className={cn(
              "text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900",
              focus,
            )}
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Slim monochrome footer — black hairline top rule, honest one-liner. */}
      <footer className="border-t border-neutral-200">
        <Reveal
          as="div"
          className={cn(
            chrome,
            "flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between",
          )}
        >
          <div className="max-w-xl space-y-1.5">
            <p className="text-sm font-semibold text-neutral-900">
              &copy; {year} {SITE.name}
            </p>
            <p className="text-sm leading-relaxed text-neutral-500">
              Real US iPhones and Androids you control from your browser — for
              app testing, QA, localization, and growth teams. No emulators, no
              &ldquo;undetectable&rdquo; claims.
            </p>
          </div>

          <nav
            aria-label="Legal"
            className="flex items-center gap-6 text-sm font-medium text-neutral-500"
          >
            <Link
              href="/terms"
              className={cn("transition-colors hover:text-neutral-900", focus)}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className={cn("transition-colors hover:text-neutral-900", focus)}
            >
              Privacy
            </Link>
          </nav>
        </Reveal>
      </footer>
    </div>
  );
}
