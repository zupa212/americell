import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db, isDbConfigured } from "@/lib/db";
import { passwordResetTokens } from "@/db/schema";
import { getUserByEmail, updatePasswordHash } from "@/lib/users";
import { sendMail } from "@/lib/mail";
import { logEvent } from "@/lib/logs";

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Issue a reset token for `email` (if the account exists) and email the link.
 * Silent when the email is unknown — no account enumeration.
 */
export async function requestPasswordReset(email: string, origin: string): Promise<void> {
  if (!isDbConfigured) return;
  const user = await getUserByEmail(email);
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

  const link = `${origin}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your Americell password",
    text: `Reset your Americell password:\n${link}\n\nThis link expires in 30 minutes. If you didn't request this, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2>Reset your password</h2>
      <p>Click the button below to set a new password. This link expires in 30 minutes.</p>
      <p><a href="${link}" style="display:inline-block;background:#2b6bff;color:#fff;padding:12px 22px;border-radius:9999px;text-decoration:none;font-weight:600">Reset password</a></p>
      <p style="color:#666;font-size:13px">If the button doesn't work, copy this link:<br>${link}</p>
      <p style="color:#999;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
  await logEvent({
    actorType: "customer",
    actorEmail: user.email,
    actorId: user.id,
    action: "password.reset_requested",
  });
}

/**
 * Consume a valid, unused, unexpired token and set the new password.
 * Returns true on success, false if the token is invalid/expired/used.
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  const tokenHash = sha256(token);
  const now = new Date();
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);
  if (!row) return false;

  const hash = await bcrypt.hash(newPassword, 10);
  await updatePasswordHash(row.userId, hash);
  // Single-use: mark this token used AND invalidate any other live tokens.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, row.id));
  await logEvent({
    actorType: "customer",
    actorId: row.userId,
    action: "password.reset_completed",
  });
  return true;
}
