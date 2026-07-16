import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/users";
import { rateLimit } from "@/lib/rate-limit";

const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

// Per-account brute-force throttle: at most 8 sign-in attempts per email per
// 15 min. Blunts password guessing against any single account. (IP-level
// throttling for credential stuffing lives in middleware.ts.)
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

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
        // Throttle before touching the DB or hashing — cheap and fail-closed.
        if (!rateLimit(`login-email:${email}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS).ok) {
          return null;
        }

        const user = await getUserByEmail(email);
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

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
