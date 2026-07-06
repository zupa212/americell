import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminNav from "@/components/admin/admin-nav";
import { Particles } from "@/components/ui/particles";
import { requireAdminPage } from "@/lib/admin";

// Keep the owner cockpit out of search indexes as a defence-in-depth measure;
// the real gate is `requireAdminPage()` below.
export const metadata: Metadata = {
  title: "Admin — Americell",
  robots: { index: false, follow: false },
};

/**
 * Admin section layout (RESELLER_PLAN §6.1/§6.2).
 *
 * The gate runs here for every `/admin/*` page: anonymous visitors are sent to
 * `/login`, signed-in non-owners get a 404 (existence not leaked), owners fall
 * through. Renders the glass chrome (sticky AdminNav) + ambient particles over
 * the global aurora. Route handlers under `/api/admin/*` do NOT inherit this —
 * each must call `requireAdmin()` itself.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { email } = await requireAdminPage();

  return (
    <div className="relative min-h-screen">
      <AdminNav email={email} />

      <main className="relative mx-auto w-full max-w-6xl px-6 py-10">
        {/* Ambient particles drifting behind the glass for depth. */}
        <Particles
          className="pointer-events-none absolute inset-0 -z-[1]"
          quantity={40}
          ease={80}
          color="#2b6bff"
          staticity={60}
        />
        {children}
      </main>
    </div>
  );
}
