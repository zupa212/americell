import Link from "next/link";
import {
  Building2,
  FlaskConical,
  Radar,
  ShieldCheck,
  Boxes,
  MoveRight,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

import PageShell from "@/components/page-shell";
import Reveal from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Who it's for", // → "Americell · Who it's for"
  description:
    "Real, physical US iPhones and Androids you run from one dashboard — see how agencies, QA teams, mobile operations, security analysts, and enterprise device pools deploy their fleet on Americell.",
  alternates: { canonical: "/use-cases" },
});

// Shared frosted-glass recipe reused across the marketing surfaces.
const GLASS = cn(
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
);

type Audience = {
  icon: ComponentType<LucideProps>;
  title: string;
  scenario: string;
};

// One card per audience — each with a concrete, real-world scenario.
const AUDIENCES: readonly Audience[] = [
  {
    icon: Building2,
    title: "Agencies",
    scenario:
      "Run client accounts and social workflows on real US phones your whole team can reach. Onboard a new client's device in minutes and hand off access without shipping a SIM or a handset across the country.",
  },
  {
    icon: FlaskConical,
    title: "QA and app validation",
    scenario:
      "Validate every release on genuine iOS and Android hardware, real carrier networks, and true push-notification behavior. Catch the bugs emulators hide before they reach the App Store or your users.",
  },
  {
    icon: Radar,
    title: "Mobile operations",
    scenario:
      "Run the repetitive, high-volume flows your business depends on — live across the fleet. Scale from a single device to hundreds from one dashboard, with session recording on every run.",
  },
  {
    icon: ShieldCheck,
    title: "Security and compliance",
    scenario:
      "Give analysts a disposable, fully-logged US device to open suspicious links, apps, and accounts in isolation. Every session is recorded and access is role-based, with a DPA available for enterprise.",
  },
  {
    icon: Boxes,
    title: "Enterprise device pools",
    scenario:
      "Retire the drawer of aging test phones for a managed, always-on fleet in the US. We handle power, connectivity, maintenance, and hardware replacement while your engineers keep one dashboard of control.",
  },
];

export default function UseCasesPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-3xl">
            {/* Frosted-glass eyebrow with a living brand-gradient dot */}
            <div
              className={cn(
                "inline-flex items-center gap-2.5 rounded-full py-1 pl-2.5 pr-3.5 text-sm",
                "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
                "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
              )}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] shadow-[0_0_10px_rgba(43,107,255,0.7)] motion-safe:animate-gradient"
              />
              <span className="font-semibold uppercase tracking-[0.14em] text-brand">
                Who it&apos;s for
              </span>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.03] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
              A fleet of real US phones,{" "}
              <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                built for the way your team works
              </span>
              .
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              You moved your servers to the cloud. Your phone fleet is next.
              Americell hosts, powers, connects, and maintains real iPhone and
              Android devices in the US — here is who runs them, and
              what they run them for.
            </p>
          </Reveal>

          {/* Audience cards */}
          <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((audience, i) => {
              const Icon = audience.icon;
              return (
                <Reveal
                  as="li"
                  key={audience.title}
                  delay={i * 0.06}
                  className="list-none"
                >
                  <div
                    className={cn(
                      GLASS,
                      "group flex h-full flex-col gap-4 p-6 sm:p-7",
                      "transition-all duration-300 hover:-translate-y-1 hover:bg-white/70",
                      "hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
                    )}
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] text-white shadow-[0_8px_24px_-8px_rgba(43,107,255,0.6)] ring-1 ring-white/40 motion-safe:animate-gradient">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {audience.title}
                    </h2>
                    <p className="text-pretty text-base leading-relaxed text-muted-foreground">
                      {audience.scenario}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section aria-labelledby="use-cases-cta" className="pb-24 sm:pb-32">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal
            className={cn(
              "relative isolate overflow-hidden rounded-3xl px-5 py-16 text-center sm:px-12 sm:py-20",
              "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
              "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
            />
            <div className="mx-auto max-w-2xl">
              <h2
                id="use-cases-cta"
                className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-4xl"
              >
                See your use case here? Deploy your fleet.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Start with a single device or scale to hundreds. We handle the
                hardware; you keep the control — live in minutes, no setup fees,
                cancel anytime.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-full px-8 py-3 text-base font-medium text-white sm:w-auto",
                    "bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] shadow-lg shadow-brand/25",
                    "transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 motion-safe:animate-gradient",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  )}
                >
                  Deploy your fleet
                </Link>
                <Link
                  href="/contact"
                  className={cn(
                    "group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-medium text-foreground sm:w-auto",
                    "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
                    "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
                    "transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  )}
                >
                  Talk to Sales
                  <MoveRight
                    aria-hidden="true"
                    className="size-4 text-brand transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
