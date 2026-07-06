import type { ComponentType } from "react";
import { Cpu, ScrollText, ShieldCheck, User } from "lucide-react";

import { requireAdminPage } from "@/lib/admin";
import { listLogs, type ActorType } from "@/lib/logs";
import type { ActivityLog } from "@/db/schema";
import LogsTable from "@/components/admin/logs-table";
import { AuroraText } from "@/components/ui/aurora-text";
import { Card, CardContent } from "@/components/ui/card";
import LottiePlayer from "@/components/ui/lottie";
import Reveal from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Admin › Activity log (RESELLER_PLAN audit trail) — owner-only Server Component.
 *
 * Reads the optional `{ action, actorType }` filters from the URL and hands them
 * to `listLogs` capped at 200 rows (newest-first). In Next 16 `searchParams` is
 * a Promise, so it MUST be awaited before its keys are read. The append-only log
 * lives in Postgres (`activity_logs`); `listLogs` is a guarded no-op when the DB
 * is unconfigured, so this page degrades to an empty state instead of throwing.
 * The owner gate runs in `app/admin/layout.tsx`; we re-assert it here as
 * defence-in-depth (every layer re-checks).
 *
 * `force-dynamic`: the audit trail is live and per-request; never cache it. It
 * also keeps the client table's `useSearchParams()` off the static-prerender
 * path (no Suspense boundary needed).
 */
export const dynamic = "force-dynamic";

// Frosted-glass surface — floats over the global aurora (SiteBackground).
const GLASS =
  "rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]";

const ACTOR_TYPES: ReadonlySet<ActorType> = new Set([
  "admin",
  "customer",
  "system",
]);

/** Narrow a raw `?actorType=` value to a valid `ActorType`, else undefined. */
function parseActorType(
  raw: string | string[] | undefined,
): ActorType | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && ACTOR_TYPES.has(value as ActorType)
    ? (value as ActorType)
    : undefined;
}

/** Trim a raw `?action=` value to a non-empty exact match, else undefined. */
function parseAction(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// ── Summary stat tiles ──────────────────────────────────────────────────────
type StatTile = {
  key: ActorType | "total";
  label: string;
  Icon: ComponentType<{ className?: string }>;
  tint: string;
};

const STAT_TILES: readonly StatTile[] = [
  {
    key: "total",
    label: "Entries in view",
    Icon: ScrollText,
    tint: "bg-brand/10 text-brand-2 ring-brand/20",
  },
  {
    key: "admin",
    label: "Admin actions",
    Icon: ShieldCheck,
    tint: "bg-violet-500/10 text-violet-600 ring-violet-500/20",
  },
  {
    key: "customer",
    label: "Customer actions",
    Icon: User,
    tint: "bg-sky-500/10 text-sky-600 ring-sky-500/20",
  },
  {
    key: "system",
    label: "System actions",
    Icon: Cpu,
    tint: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
  },
];

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string | string[];
    actorType?: string | string[];
  }>;
}) {
  await requireAdminPage();

  const sp = await searchParams;
  const action = parseAction(sp.action);
  const actorType = parseActorType(sp.actorType);

  const logs: ActivityLog[] = await listLogs({ action, actorType, limit: 200 });

  // Actor-type distribution across the rows in view — drives the stat tiles.
  const counts: Record<string, number> = { admin: 0, customer: 0, system: 0 };
  for (const log of logs) {
    counts[log.actorType] = (counts[log.actorType] ?? 0) + 1;
  }
  const statValue = (key: ActorType | "total"): number =>
    key === "total" ? logs.length : (counts[key] ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-brand-2 backdrop-blur-md"
              >
                <ScrollText className="h-4 w-4" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                <AuroraText>Logs</AuroraText>
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Audit log — every admin, customer and system action, in
              chronological order. Up to 200 recent entries shown.
            </p>
          </div>

          {/* Live indicator — Lottie pulse + label, floating on the aurora. */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 py-1 pr-3 pl-1.5 text-xs font-medium text-foreground backdrop-blur-md ring-1 ring-white/40">
            <LottiePlayer src="/lottie/pulse.json" className="h-5 w-5" />
            Live audit trail
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STAT_TILES.map((tile) => (
            <Card
              key={tile.key}
              className={cn(GLASS, "gap-0 rounded-2xl py-0")}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset [&_svg]:size-4",
                    tile.tint,
                  )}
                >
                  <tile.Icon />
                </span>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tabular-nums text-foreground">
                    {statValue(tile.key)}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {tile.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className={cn("overflow-hidden", GLASS)}>
          <LogsTable logs={logs} />
        </div>
      </Reveal>
    </div>
  );
}
