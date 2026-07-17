import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/users";
import { failureCount, recordFailure, resetKey } from "@/lib/rate-limit";

const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

// Per-account brute-force throttle: block after 8 FAILED sign-ins per email per
// 15 min. Counting only failures (and clearing on success) means a legitimate
// user's correct password is never consumed by the limit. This runs on every
// login path (REST callback AND the login Server Action), since both converge
// on authorize(). IP-level / credential-stuffing throttling lives in the
// login/signup Server Actions and proxy.ts.
const LOGIN_MAX_FAILURES = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// A fixed valid bcrypt hash compared against when the account doesn't exist, so
// an unknown email costs the same as a wrong password — no timing/enumeration
// oracle. (Hash of a random string; matches nothing.)
const DUMMY_HASH = "$2b$10$m12tKw.OufdH2Cki9R5WheP9DI8v5mmaFpxqlMjnkoOqeGhRKRDgi";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const failKey = `login-fail:${email}`;

        // Too many recent FAILURES for this account → refuse without hashing.
        if (failureCount(failKey) >= LOGIN_MAX_FAILURES) return null;

        const user = await getUserByEmail(email);
        // Always run a compare (dummy hash when the user is unknown) so the
        // response time doesn't reveal whether the account exists.
        const valid = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? DUMMY_HASH,
        );

        if (!user || !valid) {
          recordFailure(failKey, LOGIN_WINDOW_MS);
          return null;
        }

        resetKey(failKey); // success clears the counter
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
