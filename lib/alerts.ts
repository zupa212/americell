import "server-only";

/**
 * Ops alerts — email the operator when something needs attention (a customer
 * paid but activation failed, a manual refund is required, credit ran out, …).
 *
 * Sent via Resend with a plain fetch (no SDK). Fully env-guarded: a no-op unless
 * RESEND_API_KEY + ALERT_EMAIL_TO are set, so nothing breaks before it's
 * configured. NEVER throws — an alert failure must never break the webhook or
 * flow that triggered it (which is why every call site also console.errors).
 */

const KEY = process.env.RESEND_API_KEY;
const TO = process.env.ALERT_EMAIL_TO; // comma-separated
const FROM = process.env.ALERT_EMAIL_FROM ?? "Americell Alerts <onboarding@resend.dev>";

export const isAlertsConfigured = Boolean(KEY && TO);

export async function sendOpsAlert(subject: string, text: string): Promise<void> {
  if (!KEY || !TO) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: TO.split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        subject: `[Americell] ${subject}`,
        text,
      }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[alerts] email send failed:", (err as Error).message);
  }
}
