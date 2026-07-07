import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, Smartphone } from "lucide-react";

import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import type { Rental } from "@/db/schema";
import { listRentalsForUser, markExpired } from "@/lib/rentals";
import RentalCard, { type RentalCardData } from "@/components/rental-card";
import DashboardUserMenu from "@/components/dashboard-user-menu";
import { AuroraText } from "@/components/ui/aurora-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { Particles } from "@/components/ui/particles";
import Reveal from "@/components/ui/reveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Frosted-glass surface recipe — floats over the global aurora (SiteBackground).
const glassCard =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";
const glassHover =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

// Statuses that entitle a live rental (§5.4: `pooled` is active-equivalent).
const ACTIVE_STATUSES = new Set(["active", "pooled"]);

/**
 * Project a full `Rental` row down to the client-safe shape RentalCard needs.
 *
 * CRITICAL (§7.4): `streamUrl` and `pinCiphertext` are NEVER included — those
 * secrets are served only from the ownership-checked `/access` and `/pin`
 * routes, never serialized into the dashboard HTML/RSC payload. Also strips
 * reseller margin data (`wholesaleQuotedCents` / `chargedCents`) and internal
 * payment ids. Timestamps become ISO strings for a clean server→client boundary.
 */
function toCardData(r: Rental): RentalCardData {
  return {
    id: r.id,
    phoneId: r.phoneId,
    model: r.model,
    platform: r.platform,
    billingPeriod: r.billingPeriod,
    durationDays: r.durationDays,
    retailCents: r.retailCents,
    status: r.status,
    streamMintedAt: r.streamMintedAt ? r.streamMintedAt.toISOString() : null,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let rows: Rental[] = [];
  let dbError = false;
  if (isDbConfigured) {
    try {
      rows = await listRentalsForUser(session.user.id);

      // Lazy expiry (§5.5 D): flip any live rental whose expiry has passed. The
      // decision lives in SQL — `markExpired` is a guarded CAS
      // (WHERE status='active' AND expiresAt < now()), so firing it on every
      // active rental only flips the truly-expired ones (the rest match 0 rows).
      // We then re-read to reflect any flips, keeping this Server Component pure
      // (no wall-clock read during render).
      const live = rows.filter(
        (r) => r.status === "active" && r.expiresAt != null,
      );
      if (live.length > 0) {
        await Promise.all(live.map((r) => markExpired(r.id)));
        rows = await listRentalsForUser(session.user.id);
      }
    } catch {
      dbError = true;
    }
  }

  // Partition into Active (entitled) vs History (everything else).
  const active: RentalCardData[] = [];
  const history: RentalCardData[] = [];
  for (const r of rows) {
    (ACTIVE_STATUSES.has(r.status) ? active : history).push(toCardData(r));
  }

  const email = session.user.email ?? "";
  const hasAny = active.length > 0 || history.length > 0;

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg outline-none transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-bold text-white shadow-sm shadow-brand/20"
            >
              A
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              <AuroraText>Americell</AuroraText>
            </span>
          </Link>
          <DashboardUserMenu email={email} />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Ambient particles drifting behind the glass for depth. */}
        <Particles
          className="pointer-events-none absolute inset-0 -z-[1]"
          quantity={40}
          ease={80}
          color="#2b6bff"
          staticity={60}
        />

        <Reveal>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Your rentals
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage the real US phones you&rsquo;ve rented — PIN, remote control,
            and time remaining.
          </p>
        </Reveal>

        {!isDbConfigured || dbError ? (
          <Reveal delay={0.05}>
            <Alert className={cn("mt-8 border-white/50 bg-white/60 backdrop-blur-md")}>
              <Database className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>The database isn&rsquo;t connected yet.</AlertTitle>
              <AlertDescription>
                Add <code>DATABASE_URL</code> (see{" "}
                <code>.env.example</code>) and run the migrations to see your
                rentals here.
              </AlertDescription>
            </Alert>
          </Reveal>
        ) : !hasAny ? (
          <Reveal delay={0.05}>
            <Card
              className={cn(
                "relative mt-8 items-center py-12 text-center",
                glassCard,
                glassHover,
              )}
            >
              <ShineBorder
                className="rounded-3xl"
                borderWidth={1}
                duration={12}
                shineColor={["var(--color-brand)", "var(--color-brand-2)"]}
              />
              <BorderBeam
                size={90}
                duration={8}
                colorFrom="var(--color-brand)"
                colorTo="var(--color-brand-2)"
              />
              <CardHeader className="items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-brand backdrop-blur-md"
                >
                  <Smartphone className="h-6 w-6" />
                </span>
                <CardTitle className="text-lg">
                  No rentals yet.
                </CardTitle>
                <CardDescription>
                  Pick a real US phone and start controlling it live in minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="lg"
                  className="h-11 w-full rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-5 text-white shadow-sm shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_16px_40px_-16px_rgba(43,107,255,0.5)] sm:w-auto"
                  render={<Link href="/#pricing" />}
                  nativeButton={false}
                >
                  Browse devices
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        ) : (
          <div className="mt-8 flex flex-col gap-10">
            {active.length > 0 ? (
              <section>
                <Reveal>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Active
                  </h2>
                </Reveal>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {active.map((rental, i) => (
                    <Reveal as="li" key={rental.id} delay={i * 0.06}>
                      <RentalCard rental={rental} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ) : null}

            {history.length > 0 ? (
              <section>
                <Reveal>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    History
                  </h2>
                </Reveal>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {history.map((rental, i) => (
                    <Reveal as="li" key={rental.id} delay={i * 0.06}>
                      <RentalCard rental={rental} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
