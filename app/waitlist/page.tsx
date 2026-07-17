import Link from "next/link";

import WaitlistForm from "@/components/waitlist-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Waitlist", // → "Americell · Waitlist"
  description:
    "Join the Americell waitlist. Real US iPhones & Android devices, controlled from your browser. Tell us how many phones you need and we'll set you up.",
  alternates: { canonical: "/waitlist" },
});

export default function WaitlistPage() {

  return (
    <div className="dark dark-surface relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12 sm:py-16">
      {/* Dark brand backdrop with soft glows (matches the homepage). */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[5] bg-[#080b16]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-5%,rgba(43,107,255,0.22),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_88%_108%,rgba(124,58,237,0.20),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_35%_at_8%_60%,rgba(34,211,238,0.12),transparent_60%)]" />
      </div>

      <div className="flex w-full max-w-md flex-col items-center">
        <Link
          href="/"
          aria-label="Americell — Home"
          className="mb-8 block rounded-2xl outline-none transition-transform duration-300 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/americell-logo.png"
            alt="Americell"
            width={945}
            height={496}
            className="h-14 w-auto sm:h-16"
          />
        </Link>

        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]/95 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
          {/* Brand gradient banner */}
          <div className="bg-gradient-to-br from-brand via-brand-2 to-brand-soft px-6 py-6 sm:px-8">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Join the waitlist
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Real US iPhones &amp; Android, controlled from your browser — from
              your laptop or phone. Tell us how many phones you need and
              we&rsquo;ll set you up.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <WaitlistForm />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
