import * as z from "zod";

import { isDbConfigured } from "@/lib/db";
import { requestPasswordReset } from "@/lib/password-reset";

/**
 * POST /api/auth/forgot-password — start a reset. Always returns { ok:true }
 * (never reveals whether an account exists). Rate-limited in proxy.ts.
 */
const BodySchema = z.object({ email: z.email() });

export async function POST(req: Request) {
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

  if (isDbConfigured) {
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://www.ameri-cell.com";
    try {
      await requestPasswordReset(parsed.data.email, origin);
    } catch (err) {
      console.error("[forgot-password]", (err as Error).message);
    }
  }
  return Response.json({ ok: true });
}
