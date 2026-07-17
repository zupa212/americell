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
  source: z.enum(["homepage_popup", "waitlist_page"]).optional(),
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
    const source = parsed.data.source ?? "homepage_popup";
    await createLead({
      email: parsed.data.email,
      fleetSize: parsed.data.fleetSize ?? null,
      source,
    });
    await logEvent({
      actorType: "customer",
      actorEmail: parsed.data.email,
      action: "lead.captured",
      targetType: "lead",
      metadata: { fleetSize: parsed.data.fleetSize ?? null, source },
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[leads] capture failed:", (err as Error).message);
    return Response.json({ error: "Couldn't submit. Please try again." }, { status: 500 });
  }
}
