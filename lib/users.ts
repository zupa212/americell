import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { users, type User } from "@/db/schema";

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return rows[0];
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (!isDbConfigured) return undefined;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

/** Set a user's password hash (used by the password-reset flow). */
export async function updatePasswordHash(
  userId: string,
  passwordHash: string,
): Promise<void> {
  if (!isDbConfigured) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<User> {
  if (!isDbConfigured) {
    throw new Error("DATABASE_URL is not set; cannot create a user.");
  }
  const [row] = await db
    .insert(users)
    .values({ email: normalizeEmail(email), passwordHash })
    .returning();
  return row;
}
