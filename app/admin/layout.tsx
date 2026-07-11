import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminSidebar, { AdminTopbar } from "@/components/admin/admin-sidebar";
import { Particles } from "@/components/ui/particles";
import { requireAdminPage } from "@/lib/admin";

// Keep the owner cockpit out of search indexes as a defence-in-depth measure;
// the real gate is `requireAdminPage()` below.
export const metadata: Metadata = {
  title: "Admin", // → "Americell · Admin" via the brand-first template
  robots: { index: false, follow: false },
};

/**
 * Admin section layout (RESELLER_PLAN §6.1/§6.2).
 *
 * The gate runs here for every `/admin/*` page: anonymous visitors are sent to
 * `/login`, signed-in non-owners get a 404 (existence not leaked), owners fall
 * through. Renders the edge-to-edge glass dashboard shell — a fixed glass
 * sidebar on the left (md+), a slim glass topbar (mobile menu trigger + page
 * context + owner email), and a wide glass main area — all floating on the
 * global `<SiteBackground/>` aurora. Route handlers under `/api/admin/*` do NOT
 * inherit this gate — each must call `requireAdmin()` itself.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { email } = await requireAdminPage();

  return (
    <div className="dark admin-dark relative min-h-screen text-foreground">
      {/* Dark cockpit backdrop — covers the global light aurora for /admin only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[5] bg-[#0b1020]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-5%,rgba(43,107,255,0.20),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_85%_105%,rgba(124,58,237,0.18),transparent_65%)]" />
      </div>

      {/* Fixed glass rail (md+); on mobile it lives in the topbar's Sheet. */}
      <AdminSidebar email={email} />

      {/* Content column, offset by the sidebar width on md+. */}
      <div className="relative flex min-h-screen flex-col md:pl-72">
        <AdminTopbar email={email} />

        <main className="relative flex-1 px-3 pt-3 pb-6 md:px-5 md:pt-4 md:pb-8">
          {/* Ambient particles drifting behind the glass for depth. */}
          <Particles
            className="pointer-events-none absolute inset-0 -z-[1]"
            quantity={40}
            ease={80}
            color="#2b6bff"
            staticity={60}
          />
          {/* The shared glass "canvas" every admin page settles onto — a single
              calm frosted surface floating on the aurora, so pages inherit one
              consistent frame regardless of their own inner cards. */}
          <div className="mx-auto min-h-[calc(100svh-6rem)] w-full max-w-7xl rounded-3xl border border-white/50 bg-white/40 p-4 shadow-[0_18px_60px_-24px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-md md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
