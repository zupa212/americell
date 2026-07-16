import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { getRentalForUser } from "@/lib/rentals";
import { AuroraText } from "@/components/ui/aurora-text";
import StreamViewer from "@/components/stream-viewer";

export const metadata: Metadata = {
  // → "Americell · Remote control" via the brand-first template. Never leaks the
  // upstream provider's name in the tab (white-label).
  title: "Remote control",
  robots: { index: false, follow: false },
};

// "pooled" is active-equivalent for entitlement (RESELLER_PLAN §5.4).
const ACTIVE = new Set(["active", "pooled"]);

/**
 * White-label control page. The live device stream is embedded in an <iframe>
 * inside Americell's own chrome, so the customer stays on americell.* and never
 * sees the upstream provider's domain/branding. Ownership is enforced here
 * (auth + getRentalForUser); the stream URL is read server-side and handed only
 * to the authenticated owner of this rental.
 */
export default async function ControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const rental = await getRentalForUser(id, session.user.id);
  if (!rental) {
    notFound();
  }

  const live = ACTIVE.has(rental.status) && Boolean(rental.streamUrl);

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/55 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/americell-mark.png"
              alt=""
              aria-hidden="true"
              width={464}
              height={260}
              className="h-7 w-auto shrink-0"
            />
            <span className="tracking-tight">
              <AuroraText>Americell</AuroraText>
              <span className="hidden text-muted-foreground sm:inline">
                {" "}
                · Remote control
              </span>
            </span>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">
            {rental.model}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {live && rental.streamUrl ? (
          <StreamViewer
            streamUrl={rental.streamUrl}
            rentalId={rental.id}
            model={rental.model}
            platform={rental.platform}
            expiresAt={rental.expiresAt ? rental.expiresAt.toISOString() : null}
            streamMintedAt={
              rental.streamMintedAt ? rental.streamMintedAt.toISOString() : null
            }
          />
        ) : (
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/50 bg-white/60 p-8 text-center backdrop-blur-xl">
            <h1 className="text-lg font-bold text-foreground">
              This device isn&rsquo;t active
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This rental isn&rsquo;t available for remote control right now.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-6 text-sm font-semibold text-white"
            >
              Back to rentals
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
