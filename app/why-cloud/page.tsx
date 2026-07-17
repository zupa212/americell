import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  Clock,
  Globe,
  Gauge,
  LayoutDashboard,
  MoveRight,
  ScrollText,
  ServerCog,
  ShieldCheck,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import PageShell from "@/components/page-shell";
import Reveal from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Why go remote", // → "Americell · Why go remote"
  description:
    "The case for moving your phone fleet off desks and out of the office — the same way servers moved to the cloud. No office hardware, fully managed, scale from a dashboard, audit trail, global low-latency access.",
  alternates: { canonical: "/why-cloud" },
});

// Shared frosted-glass recipe, reused across every surface on the page so the
// panels read as one system floating over the global <SiteBackground/>.
const GLASS = cn(
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
);

// Pill-shaped glass, used for eyebrows and the secondary CTA.
const GLASS_PILL = cn(
  "border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40",
  "shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
);

/** Frosted eyebrow badge with a live brand-gradient dot. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full py-1 pl-2.5 pr-3.5 text-sm",
        GLASS_PILL,
      )}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft shadow-[0_0_10px_rgba(43,107,255,0.7)]"
      />
      <span className="font-semibold uppercase tracking-[0.14em] text-brand">
        {children}
      </span>
    </div>
  );
}

/** Primary + secondary CTA row, reused in the hero and the closing band. */
function CtaRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Link
        href="/signup"
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold text-white sm:w-auto",
          "bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto]",
          "shadow-lg shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        )}
      >
        Deploy your fleet
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>

      <Link
        href="/contact"
        className={cn(
          "group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-medium text-foreground sm:w-auto",
          GLASS_PILL,
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
  );
}

// The core argument: what moving your fleet remote actually buys you.
const REASONS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: Boxes,
    title: "No office hardware",
    body: "No drawers of devices, chargers, SIM trays, or powered USB hubs. The phones live in the US — your office goes back to being an office.",
  },
  {
    icon: Wrench,
    title: "Fully managed",
    body: "Hosting, power, connectivity, and maintenance are ours. A device that fails is repaired or replaced without a ticket to your team or a trip to a store.",
  },
  {
    icon: LayoutDashboard,
    title: "Scale from the dashboard",
    body: "Add or retire devices the way you resize a server group. Grow from one phone to hundreds without procurement cycles or capital sitting on a shelf.",
  },
  {
    icon: ScrollText,
    title: "A real audit trail",
    body: "Role-based access, session recording, and full logs across the fleet. You always know who touched which device, when, and what they did.",
  },
  {
    icon: Globe,
    title: "Global low-latency access",
    body: "Operate real US devices from anywhere over the global edge — typically under 50ms — so a distributed team works as if the phones were on the next desk.",
  },
  {
    icon: Zap,
    title: "Live in minutes",
    body: "Provision a device and start driving it the same day. No shipping, no imaging, no waiting on hardware to clear a loading dock.",
  },
];

// The on-premise reality vs. the remote model, side by side.
const OLD_WAY: readonly string[] = [
  "Devices, chargers, and cables tie up desks and drawers",
  "Someone on the team owns swaps, repairs, and dead batteries",
  "Adding capacity means buying, imaging, and shipping hardware",
  "Access is physical — you have to be in the room",
  "Who used which phone, and when, lives in memory",
];

const NEW_WAY: readonly string[] = [
  "Real iPhone and Android devices hosted in the US",
  "Hardware maintenance and replacement handled for you",
  "Capacity scales up or down from one dashboard",
  "Access from any browser, anywhere, over the global edge",
  "Every session is recorded and logged, with role-based access",
];

// Outcomes framed as the operational SLAs teams actually care about.
const OUTCOMES: ReadonlyArray<{
  icon: LucideIcon;
  stat: string;
  label: string;
}> = [
  { icon: ShieldCheck, stat: "99.9%", label: "Uptime, monitored and maintained" },
  { icon: Gauge, stat: "<50ms", label: "Global edge latency to real devices" },
  { icon: Clock, stat: "24/7", label: "Dedicated support and coverage" },
  { icon: ServerCog, stat: "Minutes", label: "From sign-up to a live device" },
];

export default function WhyCloudPage() {
  return (
    <PageShell>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="why-hero-heading"
        className="relative overflow-hidden py-24 sm:py-32"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-3xl">
            <Eyebrow>The case for remote</Eyebrow>

            <h1
              id="why-hero-heading"
              className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-6xl sm:leading-[1.02]"
            >
              You moved your servers to the cloud.{" "}
              <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
                Your phone fleet is next.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Real, physical iPhone and Android devices — hosted, powered,
              connected, and maintained in the US, and driven from a
              single dashboard. No emulators. No drawers of phones. No
              procurement cycles. The same move you already made for compute,
              applied to your mobile hardware.
            </p>

            <CtaRow className="mt-10" />
          </Reveal>
        </div>
      </section>

      {/* ── The migration already happened once ─────────────────────── */}
      <section
        aria-labelledby="why-migration-heading"
        className="py-12 sm:py-16"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div
              className={cn(
                "relative isolate overflow-hidden px-5 py-12 sm:px-10 sm:py-16",
                GLASS,
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
              />
              <div className="max-w-3xl">
                <h2
                  id="why-migration-heading"
                  className="text-balance text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl"
                >
                  The migration already happened once
                </h2>
                <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                  A decade ago, running your own servers meant a closet full of
                  hardware, someone to babysit it, and a purchase order every
                  time you needed more. Then compute moved to the cloud, and the
                  closet became a line item you scale with a slider.
                </p>
                <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                  Mobile hardware is still stuck in the closet. Teams that need
                  real US devices — for QA and app validation, mobile
                  operations, security and compliance, or shared device pools —
                  keep buying phones, charging them, swapping dead ones, and
                  gating access on who is physically in the room. Remote phone
                  infrastructure ends that, the same way the cloud ended the
                  server closet.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Old way vs. new way */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Reveal delay={0.05}>
              <div className={cn("h-full px-5 py-8 sm:px-8 sm:py-10", GLASS)}>
                <h3 className="text-lg font-semibold text-foreground">
                  Phones on desks
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The on-premise fleet
                </p>
                <ul className="mt-6 space-y-4">
                  {OLD_WAY.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground ring-1 ring-black/5"
                      >
                        <X className="size-3.5" />
                      </span>
                      <span className="text-pretty leading-relaxed text-muted-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                className={cn(
                  "relative isolate h-full overflow-hidden px-5 py-8 sm:px-8 sm:py-10",
                  GLASS,
                )}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
                />
                <h3 className="text-lg font-semibold text-foreground">
                  Phones in the cloud
                </h3>
                <p className="mt-1 text-sm text-brand">The AMERICELL fleet</p>
                <ul className="mt-6 space-y-4">
                  {NEW_WAY.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white shadow-sm shadow-brand/30"
                      >
                        <Check className="size-3.5" />
                      </span>
                      <span className="text-pretty leading-relaxed text-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Reasons grid ────────────────────────────────────────────── */}
      <section
        aria-labelledby="why-reasons-heading"
        className="py-12 sm:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-3xl">
            <Eyebrow>What you get back</Eyebrow>
            <h2
              id="why-reasons-heading"
              className="mt-6 text-balance text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl"
            >
              Six reasons the fleet leaves the office
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Moving remote is not about giving anything up. It is about handing
              the parts that never made you money — the hardware, the power, the
              maintenance — to infrastructure built to run them.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={0.04 * i} as="article">
                <div
                  className={cn(
                    "group h-full px-6 py-7 transition-all duration-300 hover:-translate-y-1",
                    "hover:shadow-[0_28px_80px_-28px_rgba(43,107,255,0.45)]",
                    GLASS,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-sm shadow-brand/30"
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Outcomes / operational SLAs ─────────────────────────────── */}
      <section aria-labelledby="why-outcomes-heading" className="py-12 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div
              className={cn(
                "relative isolate overflow-hidden px-5 py-12 sm:px-10 sm:py-14",
                GLASS,
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
              />
              <h2
                id="why-outcomes-heading"
                className="max-w-3xl text-balance text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl"
              >
                Run mobile hardware like the rest of your stack
              </h2>
              <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                Turn a fixed capital purchase into elastic operating spend, with
                the uptime, latency, and support you already expect from cloud
                infrastructure.
              </p>

              <dl className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {OUTCOMES.map(({ icon: Icon, stat, label }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 items-center justify-center rounded-xl bg-white/70 text-brand ring-1 ring-white/50"
                    >
                      <Icon className="size-5" />
                    </span>
                    <dt className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
                      {stat}
                    </dt>
                    <dd className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="why-cta-heading"
        className="relative overflow-hidden py-20 sm:py-28"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div
              className={cn(
                "relative isolate overflow-hidden px-5 py-14 text-center sm:px-12 sm:py-20",
                GLASS,
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
              />
              <div className="flex justify-center">
                <Eyebrow>Remote phone infrastructure</Eyebrow>
              </div>

              <h2
                id="why-cta-heading"
                className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl sm:leading-[1.02]"
              >
                Get the phones out of the office
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Start with a single device or scale to hundreds. We handle the
                hardware, the power, the connectivity, and the maintenance — you
                keep the control, and the dashboard.
              </p>

              <CtaRow className="mt-10 justify-center sm:justify-center" />

              <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                {[
                  "Live in minutes, not procurement cycles",
                  "Hardware maintenance and replacement included",
                  "Session recording and full logs",
                  "DPA available for enterprise",
                ].map((item) => (
                  <li key={item} className="inline-flex items-center gap-2">
                    <Check
                      aria-hidden="true"
                      className="size-4 shrink-0 text-brand"
                    />
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
