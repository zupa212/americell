"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { createUser, getUserByEmail } from "@/lib/users";
import { logEvent } from "@/lib/logs";

export type AuthState = { error: string | null };

const SignupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and a password of at least 8 characters." };
  }
  if (!isDbConfigured) {
    return { error: "Sign-up isn't available until the database is configured." };
  }

  const { email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await createUser(email, passwordHash);

  // Best-effort audit log (never throws, never blocks). No password recorded.
  await logEvent({
    actorType: "customer",
    actorEmail: email,
    action: "customer.signup",
  });

  // signIn redirects on success (throws NEXT_REDIRECT, which must propagate).
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return { error: null };
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isDbConfigured) {
    return { error: "Log-in isn't available until the database is configured." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null };
  } catch (error) {
    // AuthError = bad credentials; anything else (e.g. NEXT_REDIRECT) must rethrow.
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    // Reaching here means signIn succeeded and is throwing its redirect, so this
    // is a successful login. Best-effort audit log (never throws, no password),
    // then rethrow so the NEXT_REDIRECT propagates unchanged.
    await logEvent({
      actorType: "customer",
      actorEmail: email,
      action: "customer.login",
    });
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
