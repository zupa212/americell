import Link from "next/link";
import {
  Rocket,
  LayoutDashboard,
  Users,
  Video,
  ShieldCheck,
  Server,
  Gauge,
  Globe,
  Clock,
  Radio,
  Network,
  KeyRound,
  ScrollText,
  Lock,
  Wrench,
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

import PageShell from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "The Platform", // → "Americell · The Platform"
  description:
    "The architecture behind your fleet: provisioning in minutes, remote control from one dashboard, role-based access, full session recording and logs, and security by default.",
  alternates: { canonical: "/platform" },
});

/** Shared glass surface — matches the marketing site's card system. */
const glassSurface =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const glassHover =
  "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]";

type Pillar = {
  icon: LucideIcon;
  title: string;
  body: string;
  points: readonly string[];
};

/** The five load-bearing systems that make up the platform, plus managed hardware. */
const PILLARS: readonly Pillar[] = [
  {
    icon: Rocket,
    title: "Provisioning in minutes",
    body: "Real iPhones and Android devices come online on demand — no procurement, no shipping, no racking. Request a device and it is warm, networked, and yours in minutes.",
    points: [
      "Pick a device profile and go live",
      "US-based, always-on infrastructure",
      "Scale the fleet up or down without hardware lead time",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "One dashboard, full remote control",
    body: "Drive every device from the browser in real time — tap, type, swipe, and stream. The whole fleet lives in a single pane of glass, from one device to hundreds.",
    points: [
      "Live low-latency stream, no installs or cables",
      "Fleet inventory, status, and health at a glance",
      "Automate repetitive flows across many devices",
    ],
  },
  {
    icon: Users,
    title: "Role-based access",
    body: "Give each teammate exactly the access they need. Scope who can view, control, and administer devices, and change it the moment your team does.",
    points: [
      "Granular viewer / operator / admin roles",
      "Per-device and per-group permissions",
      "SSO-ready for enterprise identity",
    ],
  },
  {
    icon: Video,
    title: "Session recording & full logs",
    body: "Every session is recorded and every action is logged. Reconstruct exactly what happened, on which device, by whom, and when — for audits, QA, and accountability.",
    points: [
      "Automatic session recording",
      "Complete, timestamped activity logs",
      "Searchable history across the fleet",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security by default",
    body: "Access is authenticated, scoped, and observable. Devices run in US datacenters, sessions are governed, and enterprise teams get a DPA to satisfy compliance.",
    points: [
      "Isolated, US-hosted devices",
      "Least-privilege access controls",
      "DPA available for enterprise",
    ],
  },
  {
    icon: Server,
    title: "Managed hardware & uptime",
    body: "We host, power, connect, and maintain the physical devices. Hardware maintenance and replacement are included, so a dead battery or a failed handset is never your problem.",
    points: [
      "Hosting, power, and connectivity handled",
      "Maintenance and replacement included",
      "Engineered for 99.9% uptime",
    ],
  },
];

type InfraStat = {
  icon: LucideIcon;
  value: string;
  label: string;
};

/** The infrastructure guarantees that sit under every pillar. */
const INFRA_STATS: readonly InfraStat[] = [
  { icon: Globe, value: "<50ms", label: "Global edge latency" },
  { icon: Gauge, value: "99.9%", label: "Uptime target" },
  { icon: Clock, value: "Minutes", label: "From request to live" },
  { icon: Radio, value: "24/7", label: "Dedicated support" },
];

type FlowStep = {
  icon: LucideIcon;
  n: string;
  title: string;
  body: string;
};

/** How a single device goes from request to governed control. */
const FLOW: readonly FlowStep[] = [
  {
    icon: Rocket,
    n: "01",
    title: "Provision",
    body: "Choose a device and it comes online in a US datacenter — hosted, powered, and networked.",
  },
  {
    icon: Network,
    n: "02",
    title: "Connect",
    body: "The live stream opens in your browser over the global edge. No installs, no cables.",
  },
  {
    icon: LayoutDashboard,
    n: "03",
    title: "Control",
    body: "Operate the real device in real time, or automate repetitive flows across the fleet.",
  },
  {
    icon: ShieldCheck,
    n: "04",
    title: "Govern",
    body: "Every action runs under role-based access, session recording, and full logs.",
  },
];

/** Security guarantees, called out separately because compliance teams ask. */
const SECURITY_POINTS: readonly string[] = [
  "Real devices isolated in US datacenters",
  "Least-privilege, role-based access controls",
  "Full session recording for every connection",
  "Complete, timestamped, searchable audit logs",
  "SSO-ready for enterprise identity providers",
  "Data Processing Agreement (DPA) for enterprise",
];

export default function PlatformPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 sm:py-32">
          <Reveal className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft"
              />
              The platform
            </p>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl lg:text-6xl">
              The architecture behind{" "}
              <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
                your fleet
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              You moved your servers to the cloud. Your phone fleet is next.
              Americell hosts real iPhones and Android devices in US
              datacenters and gives you a single system to provision, control,
              and govern them — with the access controls, recording, and logs
              your team already expects from its infrastructure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="h-11 gap-2 bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-6 text-white shadow-sm shadow-brand/25 hover:opacity-95"
                render={<Link href="/signup" />}
                nativeButton={false}
              >
                Deploy your fleet
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6"
                render={<Link href="/contact" />}
                nativeButton={false}
              >
                Talk to Sales
              </Button>
            </div>
          </Reveal>

          {/* Infrastructure guarantees */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-6 lg:grid-cols-4">
            {INFRA_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Reveal key={stat.label} delay={i * 0.08}>
                  <div className={cn("h-full p-5 sm:p-6", glassSurface)}>
                    <Icon
                      className="h-5 w-5 text-brand"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section
        aria-labelledby="pillars-heading"
        className="relative overflow-hidden"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <Reveal className="max-w-3xl">
            <h2
              id="pillars-heading"
              className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl"
            >
              Five systems, one platform
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Each device you run sits on the same managed foundation. Here is
              what that foundation gives you.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <Reveal key={pillar.title} delay={(i % 3) * 0.1} as="article">
                  <div
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden p-6 sm:p-8",
                      glassSurface,
                      glassHover
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      strokeWidth={1.25}
                      className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-brand/[0.06] transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110"
                    />
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-white shadow-lg shadow-brand/25 ring-1 ring-white/40">
                      <Icon
                        className="h-6 w-6"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                    <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {pillar.body}
                    </p>
                    <ul className="mt-5 space-y-2.5 border-t border-line/60 pt-5">
                      {pillar.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                        >
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How a device goes live */}
      <section
        aria-labelledby="flow-heading"
        className="relative overflow-hidden"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <Reveal className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft"
              />
              The lifecycle
            </p>
            <h2
              id="flow-heading"
              className="mt-4 text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl"
            >
              How a device goes live
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              From request to governed control, every device follows the same
              path.
            </p>
          </Reveal>

          <ol
            role="list"
            className="mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.n} delay={i * 0.1} as="li">
                  <div className={cn("h-full p-6", glassSurface)}>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-white shadow-lg shadow-brand/25 ring-1 ring-white/40">
                        <Icon
                          className="h-5 w-5"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-sm font-semibold tabular-nums tracking-[0.2em] text-muted-foreground/60"
                      >
                        {step.n}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Security & compliance */}
      <section
        aria-labelledby="security-heading"
        className="relative overflow-hidden"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div
              className={cn(
                "grid grid-cols-1 gap-10 overflow-hidden p-8 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-14 lg:p-12",
                glassSurface
              )}
            >
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                  <Lock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Security &amp; compliance
                </p>
                <h2
                  id="security-heading"
                  className="mt-4 text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl"
                >
                  Governed like the rest of your infrastructure
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Real devices demand real controls. Access is authenticated
                  and scoped, every session is recorded, and every action is
                  logged — so your security and compliance teams can trust the
                  fleet the same way they trust your cloud.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-foreground ring-1 ring-white/40 backdrop-blur-xl">
                    <KeyRound
                      className="h-4 w-4 text-brand"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Role-based access
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-foreground ring-1 ring-white/40 backdrop-blur-xl">
                    <ScrollText
                      className="h-4 w-4 text-brand"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Full audit logs
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-foreground ring-1 ring-white/40 backdrop-blur-xl">
                    <Wrench
                      className="h-4 w-4 text-brand"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Managed & maintained
                  </span>
                </div>
              </div>

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SECURITY_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 rounded-2xl border border-line/60 bg-white/40 p-4 text-sm leading-relaxed text-foreground"
                  >
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <div
              className={cn(
                "relative overflow-hidden p-8 text-center sm:p-12 lg:p-16",
                glassSurface
              )}
            >
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl lg:text-5xl">
                You moved your servers to the cloud.{" "}
                <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
                  Your phone fleet is next.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Deploy real US devices in minutes and run them from one
                dashboard — with the access, recording, and logs your team
                already expects.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 w-full gap-2 bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-6 text-white shadow-sm shadow-brand/25 hover:opacity-95 sm:w-auto"
                  render={<Link href="/signup" />}
                  nativeButton={false}
                >
                  Deploy your fleet
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-full px-6 sm:w-auto"
                  render={<Link href="/contact" />}
                  nativeButton={false}
                >
                  Talk to Sales
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
