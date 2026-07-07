import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Page not found",
  description:
    "The page you’re looking for doesn’t exist or has moved. Head back to the Americell home page.",
  robots: { index: false, follow: false },
});

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-24">
        <div className="flex flex-col items-center text-center">
          <p className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
            404
          </p>
          <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
            Page not found.
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The page you’re looking for may have moved, been deleted, or never
            existed.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="h-11 w-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 hover:opacity-95 sm:h-9 sm:w-auto"
              render={<Link href="/" />}
              nativeButton={false}
            >
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
