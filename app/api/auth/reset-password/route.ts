import * as z from "zod";

import { resetPassword } from "@/lib/password-reset";

/**
 * POST /api/auth/reset-password — set a new password from a valid reset token.
 * Rate-limited in proxy.ts.
 */
const BodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const ok = await resetPassword(parsed.data.token, parsed.data.password);
  if (!ok) {
    return Response.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }
  return Response.json({ ok: true });
}
