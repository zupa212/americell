import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { activityLogs, type ActivityLog } from "@/db/schema";

export type ActorType = "admin" | "customer" | "system";

export type LogInput = {
  actorType: ActorType;
  actorEmail?: string | null;
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Best-effort append to the audit log. NEVER throws and NEVER blocks the caller's
 * happy path — logging must not break a checkout/activation/admin action. No-op
 * when the DB is unconfigured. Do NOT log secrets (pin/stream_url/api keys).
 */
export async function logEvent(input: LogInput): Promise<void> {
  if (!isDbConfigured) return;
  try {
    await db.insert(activityLogs).values({
      actorType: input.actorType,
      actorEmail: input.actorEmail ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error("[logs] failed to write activity log", err);
  }
}

export type LogFilter = {
  action?: string;
  actorType?: ActorType;
  actorEmail?: string;
  limit?: number;
};

/** Newest-first log listing with optional filters. */
export async function listLogs(filter: LogFilter = {}): Promise<ActivityLog[]> {
  if (!isDbConfigured) return [];
  const conds = [];
  if (filter.action) conds.push(eq(activityLogs.action, filter.action));
  if (filter.actorType) conds.push(eq(activityLogs.actorType, filter.actorType));
  if (filter.actorEmail) conds.push(eq(activityLogs.actorEmail, filter.actorEmail));

  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
  const where = conds.length ? and(...conds) : undefined;

  return db
    .select()
    .from(activityLogs)
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}
