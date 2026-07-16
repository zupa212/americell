import "server-only";

import { desc } from "drizzle-orm";

import { db, isDbConfigured } from "@/lib/db";
import { leads, type Lead } from "@/db/schema";

/** Capture a marketing lead (upsert by email, so re-submits don't duplicate). */
export async function createLead(input: {
  email: string;
  fleetSize?: string | null;
  source?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  await db
    .insert(leads)
    .values({
      email,
      fleetSize: input.fleetSize ?? null,
      source: input.source ?? "homepage_popup",
    })
    .onConflictDoUpdate({
      target: leads.email,
      set: { fleetSize: input.fleetSize ?? null },
    });
}

/** All leads, newest first (admin). */
export async function listLeads(limit = 500): Promise<Lead[]> {
  if (!isDbConfigured) return [];
  try {
    return await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}
