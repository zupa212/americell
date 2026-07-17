import "server-only";

/**
 * Transactional email via Resend (plain fetch, no SDK). Env-guarded by
 * RESEND_API_KEY — a no-op that returns false (and logs) when unconfigured, so
 * flows don't crash before email is set up. Never throws.
 */
const KEY = process.env.RESEND_API_KEY;
const FROM =
  process.env.MAIL_FROM ??
  process.env.ALERT_EMAIL_FROM ??
  "Americell <onboarding@resend.dev>";

export const isMailConfigured = Boolean(KEY);

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (!KEY) {
    console.warn("[mail] RESEND_API_KEY not set — not sent:", input.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[mail] send failed:", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[mail] send error:", (err as Error).message);
    return false;
  }
}
