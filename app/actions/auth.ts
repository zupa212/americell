"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { createUser, getUserByEmail } from "@/lib/users";

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
    return { error: "Δώσε ένα έγκυρο email και έναν κωδικό τουλάχιστον 8 χαρακτήρων." };
  }
  if (!isDbConfigured) {
    return { error: "Η εγγραφή δεν είναι διαθέσιμη μέχρι να ρυθμιστεί η βάση δεδομένων." };
  }

  const { email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "Υπάρχει ήδη λογαριασμός με αυτό το email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await createUser(email, passwordHash);

  // signIn redirects on success (throws NEXT_REDIRECT, which must propagate).
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return { error: null };
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isDbConfigured) {
    return { error: "Η σύνδεση δεν είναι διαθέσιμη μέχρι να ρυθμιστεί η βάση δεδομένων." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null };
  } catch (error) {
    // AuthError = bad credentials; anything else (e.g. NEXT_REDIRECT) must rethrow.
    if (error instanceof AuthError) {
      return { error: "Λάθος email ή κωδικός." };
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
