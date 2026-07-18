import "server-only";

import { sendMail } from "@/lib/mail";
import { SITE } from "@/lib/site";

/**
 * Branded customer transactional emails (welcome on sign-up, notification on
 * sign-in). Built on the shared `sendMail` (Resend via fetch).
 *
 * BEST-EFFORT by construction: `sendMail` never throws and is a silent no-op
 * until RESEND_API_KEY is set, so calling these can never block or abort an auth
 * flow. Both return a boolean (sent?) that callers may ignore.
 *
 * Email <img> needs an ABSOLUTE URL — inline logos can't use /public relative
 * paths — so we build it from NEXT_PUBLIC_SITE_URL (falls back to the prod
 * domain).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ameri-cell.com";
const LOGO_URL = `${SITE_URL}/americell-logo.png`;
const BRAND = "#2b6bff";

/** Shared branded shell: centred logo header, white card body, muted footer. */
function shell(bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;color:#0b1020">
    <div style="text-align:center;padding:10px 0 16px">
      <img src="${LOGO_URL}" alt="${SITE.name}" height="28" style="height:28px;border:0" />
    </div>
    <div style="border:1px solid #e6e8f0;border-radius:16px;padding:28px 24px;background:#ffffff">
      ${bodyHtml}
    </div>
    <p style="color:#9aa0ae;font-size:12px;text-align:center;margin-top:16px">
      ${SITE.name} · Real US phones, controlled from your phone.
    </p>
  </div>`;
}

/** Welcome email — sent once, on sign-up (from the signup Server Action). */
export async function sendWelcomeEmail(to: string): Promise<boolean> {
  const cta = `${SITE_URL}/dashboard`;
  return sendMail({
    to,
    subject: `Welcome to ${SITE.name} 🇺🇸`,
    text: `Welcome to ${SITE.name}!

Your account is ready. Rent a real US iPhone or Android — US SIM & data included — and control it live, right from your phone.

Open your dashboard: ${cta}

If you didn't create this account, you can safely ignore this email.`,
    html: shell(`
      <h2 style="margin:0 0 8px;font-size:20px">Welcome aboard 🇺🇸</h2>
      <p style="margin:0 0 14px;line-height:1.55;color:#3a4152">Your ${SITE.name} account is ready. Rent a real US iPhone or Android — US SIM &amp; data included — and control it live, right from your phone.</p>
      <p style="margin:0 0 22px"><a href="${cta}" style="display:inline-block;background:${BRAND};color:#fff;padding:12px 22px;border-radius:9999px;text-decoration:none;font-weight:600">Open your dashboard</a></p>
      <p style="margin:0;color:#9aa0ae;font-size:12px">If you didn't create this account, you can safely ignore this email.</p>
    `),
  });
}

/** Sign-in notification — sent on each interactive login (login Server Action). */
export async function sendSigninEmail(
  to: string,
  meta?: { ip?: string; when?: Date },
): Promise<boolean> {
  const whenStr = meta?.when ? meta.when.toUTCString() : "just now";
  const ipStr = meta?.ip && meta.ip !== "unknown" ? meta.ip : null;
  const reset = `${SITE_URL}/forgot-password`;
  return sendMail({
    to,
    subject: `New sign-in to your ${SITE.name} account`,
    text: `New sign-in to your ${SITE.name} account.

Time: ${whenStr}${ipStr ? `\nIP: ${ipStr}` : ""}

If this was you, no action is needed. If it wasn't, reset your password immediately: ${reset}`,
    html: shell(`
      <h2 style="margin:0 0 8px;font-size:20px">New sign-in detected</h2>
      <p style="margin:0 0 14px;line-height:1.55;color:#3a4152">We noticed a new sign-in to your ${SITE.name} account.</p>
      <table style="font-size:14px;color:#3a4152;margin:0 0 18px;border-collapse:collapse">
        <tr><td style="padding:2px 14px 2px 0;color:#9aa0ae">Time</td><td>${whenStr}</td></tr>
        ${ipStr ? `<tr><td style="padding:2px 14px 2px 0;color:#9aa0ae">IP</td><td>${ipStr}</td></tr>` : ""}
      </table>
      <p style="margin:0 0 8px;line-height:1.55;color:#3a4152">If this was you, there's nothing to do. If it wasn't, reset your password right away:</p>
      <p style="margin:8px 0 0"><a href="${reset}" style="display:inline-block;background:${BRAND};color:#fff;padding:10px 20px;border-radius:9999px;text-decoration:none;font-weight:600">Reset password</a></p>
    `),
  });
}
