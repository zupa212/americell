import * as z from "zod";

import { isDbConfigured } from "@/lib/db";
import { createLead } from "@/lib/leads";
import { logEvent } from "@/lib/logs";

/**
 * POST /api/leads — public marketing lead capture (homepage popup). No auth: it's
 * a lead form. Deduped by email; logged for the audit trail.
 */
const BodySchema = z.object({
  email: z.email(),
  fleetSize: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  if (!isDbConfigured) {
    return Response.json({ error: "Not available right now." }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    await createLead({
      email: parsed.data.email,
      fleetSize: parsed.data.fleetSize ?? null,
    });
    await logEvent({
      actorType: "customer",
      actorEmail: parsed.data.email,
      action: "lead.captured",
      targetType: "lead",
      metadata: { fleetSize: parsed.data.fleetSize ?? null, source: "homepage_popup" },
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[leads] capture failed:", (err as Error).message);
    return Response.json({ error: "Couldn't submit. Please try again." }, { status: 500 });
  }
}
