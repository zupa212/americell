import "server-only";

import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";

/**
 * Admin core (RESELLER_PLAN §6.1, §7.5).
 *
 * The owner gate is a pure **environment allowlist** — no DB column, no
 * JWT/header/body flag. Authorization is decided ONLY by comparing the
 * server-session email against `ADMIN_EMAILS`, so nothing client-forgeable can
 * grant access. This is the single place `ADMIN_EMAILS` is read (§7.1).
 */
const ALLOW: readonly string[] = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/**
 * True iff `email` is on the owner allowlist. Case-insensitive and
 * whitespace-tolerant; empty / null / undefined is never an admin.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOW.includes(email.trim().toLowerCase());
}

export type AdminIdentity = { email: string; id: string };

/**
 * Page gate for `app/admin/*` (used by `app/admin/layout.tsx`).
 *
 * - anonymous          → `redirect("/login")`
 * - logged-in non-owner → `notFound()` — a **404** so the panel's very
 *   existence isn't leaked to signed-in strangers
 * - owner              → `{ email, id }`
 *
 * Both `redirect` and `notFound` throw (`never`) and terminate rendering, so
 * the returned identity is only ever reached on the authorized path. Call this
 * from a layout/page, never a route handler (layouts don't run for handlers).
 */
export async function requireAdminPage(): Promise<AdminIdentity> {
  const session = await auth();
  const id = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  if (!session?.user || !id) {
    redirect("/login");
  }
  if (!isAdminEmail(email)) {
    notFound();
  }

  // `isAdminEmail` only returns true for a non-empty allow-listed string.
  return { email: email as string, id };
}

/**
 * Greek status map for CellGods failures (RESELLER_PLAN §6.3) — shared by every
 * `/api/admin/*` proxy route and any admin page that surfaces a `CellgodsError`.
 * `0` (transport/timeout) and anything unmapped fall back to the 500 message.
 */
const CELLGODS_GREEK: Readonly<Record<number, string>> = {
  400: "Μη έγκυρο αίτημα",
  401: "Λείπει το κλειδί API",
  402: "Ανεπαρκές υπόλοιπο — πρόσθεσε πίστωση",
  403: "Μη έγκυρο κλειδί API",
  404: "Δεν βρέθηκε",
  409: "Η συσκευή δεν είναι πλέον διαθέσιμη",
  429: "Πολλά αιτήματα",
  500: "Σφάλμα διακομιστή",
};

/** Map a CellGods HTTP status to its Greek user-facing message (§6.3). */
export function cellgodsStatusMessage(status: number): string {
  return CELLGODS_GREEK[status] ?? CELLGODS_GREEK[500];
}

export type AdminGate = {
  session: Session | null;
  status: 200 | 401 | 403;
};

/**
 * Route gate for every `/api/admin/*` handler (§6.1, §7.5). Layouts don't run
 * for route handlers, so each handler MUST call this itself. Unlike the page
 * gate it never throws for auth failures — it returns a status the caller maps
 * to a `Response`:
 *
 * - `401` anonymous (no valid session)
 * - `403` logged-in non-owner
 * - `200` owner (proceed; `session` is guaranteed non-null)
 */
export async function requireAdmin(): Promise<AdminGate> {
  const session = await auth();

  if (!session?.user?.id) {
    return { session: null, status: 401 };
  }
  if (!isAdminEmail(session.user.email)) {
    return { session, status: 403 };
  }
  return { session, status: 200 };
}
