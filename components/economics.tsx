import { Check, Sparkles, X } from "lucide-react";

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * The Economics — a premium "in-house fleet vs AMERICELL" cost comparison.
 *
 * Enterprise repositioning: buying, provisioning and babysitting your own
 * phones looks cheap until you add it all up. This section lays the true cost
 * of an in-house device fleet next to what a dedicated AMERICELL device
 * includes, across eight lines — hardware, provisioning, connectivity,
 * maintenance, people, worldwide access, security & audit, and scaling.
 *
 * Server Component (no motion of its own — entrance is delegated to <Reveal/>).
 * Mobile-first: the comparison stacks into per-row glass cards under `md`, and
 * becomes a real semantic table from `md` up, so it never overflows a phone.
 */

// Shared frosted-glass recipe reused across the site's surfaces.
const GLASS = cn(
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl",
  "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
);

type Row = {
  /** What is being compared. */
  category: string;
  /** The reality of running it in-house. */
  inHouse: string;
  /** What AMERICELL includes instead. */
  americell: string;
};

// Eight lines that decide the real cost of a phone fleet.
const ROWS: readonly Row[] = [
  {
    category: "Hardware",
    inHouse: "$800+ upfront per device, depreciating from day one",
    americell: "$0 upfront — the physical device is included",
  },
  {
    category: "Provisioning",
    inHouse: "IT hours to unbox, set up and enroll every device",
    americell: "Ready in minutes, straight from the dashboard",
  },
  {
    category: "Connectivity",
    inHouse: "Carrier contracts and SIMs to source and manage",
    americell: "Optional SIM data plans from $15/mo",
  },
  {
    category: "Maintenance & replacement",
    inHouse: "Loss, theft and breakage are your problem",
    americell: "Included — we swap faulty hardware for you",
  },
  {
    category: "People",
    inHouse: "Staff charging, updating and babysitting devices",
    americell: "Fully managed — nobody ever touches a device",
  },
  {
    category: "Worldwide access",
    inHouse: "Build and run your own low-latency network",
    americell: "Global edge streaming under 50ms",
  },
  {
    category: "Security & audit",
    inHouse: "Shared devices with no audit trail",
    americell: "Role-based access, session recording, full logs",
  },
  {
    category: "Scaling",
    inHouse: "Procurement cycles measured in weeks",
    americell: "Add or remove devices from the dashboard",
  },
];

/** In-house line item: the cost/pain, marked with a muted cross. */
function CostCell({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20"
      >
        <X className="size-3.5" />
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground">
        {text}
      </span>
    </div>
  );
}

/** AMERICELL line item: what's included, marked with a brand check. */
function ValueCell({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20"
      >
        <Check className="size-3.5" />
      </span>
      <span className="text-sm font-medium leading-relaxed text-foreground">
        {text}
      </span>
    </div>
  );
}

export default function Economics() {
  return (
    <section
      id="economics"
      aria-labelledby="economics-heading"
      className="py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <Reveal className="max-w-3xl">
          {/* Flashy frosted-glass eyebrow with a live brand-gradient dot */}
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
            <AnimatedShinyText className="font-semibold uppercase tracking-[0.14em] text-brand">
              The economics
            </AnimatedShinyText>
          </div>

          <h2
            id="economics-heading"
            className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl"
          >
            What an in-house phone fleet{" "}
            <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              really costs
            </span>
            .
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Buying, provisioning and babysitting your own devices looks cheap
            until you add it all up. Here is the same fleet, in-house versus on
            AMERICELL — hardware, people, connectivity and everything in
            between.
          </p>
        </Reveal>

        {/* ---------- Mobile: stacked per-row glass cards (no wide table) ---------- */}
        <Reveal delay={0.1} className="mt-14 md:hidden">
          <ul className="grid grid-cols-1 gap-4">
            {ROWS.map((row) => (
              <li key={row.category} className={cn(GLASS, "list-none p-5")}>
                <p className="text-base font-bold tracking-tight text-foreground">
                  {row.category}
                </p>

                <div className="mt-4 space-y-3">
                  {/* In-house */}
                  <div className="rounded-2xl border border-white/50 bg-white/40 p-3.5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      In-house fleet
                    </p>
                    <CostCell text={row.inHouse} />
                  </div>

                  {/* AMERICELL */}
                  <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-3.5 ring-1 ring-brand/10">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                      AMERICELL
                    </p>
                    <ValueCell text={row.americell} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ---------- md+: real semantic comparison table ---------- */}
        <Reveal delay={0.1} className="mt-16 hidden md:block">
          <div className={cn(GLASS, "overflow-hidden")}>
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                In-house phone fleet versus AMERICELL, compared across cost,
                setup, connectivity, maintenance, people, access, security and
                scaling.
              </caption>
              <thead>
                <tr className="border-b border-white/50">
                  <th
                    scope="col"
                    className="w-[26%] px-6 py-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    <span className="sr-only">Category</span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 text-sm font-semibold tracking-tight text-muted-foreground"
                  >
                    In-house fleet
                  </th>
                  <th
                    scope="col"
                    className="bg-brand/[0.06] px-6 py-5 text-sm font-bold tracking-tight"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                        AMERICELL
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand to-brand-2 shadow-[0_0_8px_rgba(43,107,255,0.7)]"
                      />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {ROWS.map((row) => (
                  <tr
                    key={row.category}
                    className="align-top transition-colors duration-200 hover:bg-white/40"
                  >
                    <th
                      scope="row"
                      className="px-6 py-5 text-left text-base font-bold tracking-tight text-foreground"
                    >
                      {row.category}
                    </th>
                    <td className="px-6 py-5">
                      <CostCell text={row.inHouse} />
                    </td>
                    <td className="bg-brand/[0.035] px-6 py-5">
                      <ValueCell text={row.americell} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* ---------- Bottom line ---------- */}
        <Reveal delay={0.15} className="mt-8">
          <div
            className={cn(
              GLASS,
              "relative isolate overflow-hidden px-6 py-8 sm:px-10 sm:py-9",
              "flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            {/* Brand gradient wash tinting the glass */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-brand-2/5 to-brand-soft/10"
            />

            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] text-white shadow-[0_8px_24px_-8px_rgba(43,107,255,0.6)] ring-1 ring-white/40 motion-safe:animate-gradient"
              >
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  One dedicated real phone —{" "}
                  <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                    everything above included
                  </span>
                  .
                </p>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  No upfront hardware, no maintenance, no procurement cycles —
                  just a real, physical device you drive from one dashboard.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
