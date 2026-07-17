import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About", // → "Americell · About"
  description:
    "Americell gives you access to real US smartphones you control from your browser. Learn what it is, who it’s for, our values, and our mission.",
  alternates: { canonical: "/about" },
});

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-24">
        <h1 className="text-3xl font-bold sm:text-4xl">
          About{" "}
          <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
            Americell
          </span>
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Americell is a platform that gives you access to real, physical
          smartphones hosted in the US — and lets you operate them live,
          straight from your browser, from anywhere in the world.
        </p>

        <h2 className="mt-10 text-xl font-semibold">What Americell is</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          It’s not an emulator or a virtual device. Behind every connection is a
          real device, with a real operating system, a real network, and real
          behavior. You see its screen in real time and operate it as if you
          were holding it in your hands.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Real US phones — physical devices running on infrastructure in the
            United States.
          </li>
          <li>
            Remote control from the browser — no installs, no cables, no
            specialized equipment.
          </li>
          <li>
            Live, hands-on control of a single device or an entire fleet — from
            your laptop or phone.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Who it’s for</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Americell is built for teams and professionals who need access to real
          US devices without maintaining their own hardware.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Agencies managing accounts and workflows on behalf of their clients.
          </li>
          <li>
            QA testers who want to confirm behavior on real devices and network
            conditions.
          </li>
          <li>
            Development teams building and testing mobile apps in a real
            environment.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Our values</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Real hardware.</span>{" "}
            You always work with real devices — not simulations that hide
            discrepancies.
          </li>
          <li>
            <span className="font-medium text-foreground">Transparency.</span>{" "}
            You know what you’re controlling, where the device is, and how the
            service works. No hidden fees or fuzzy limits.
          </li>
          <li>
            <span className="font-medium text-foreground">Legitimate use.</span>{" "}
            We support legitimate use of the devices only. We do not facilitate
            fraud, rule circumvention, or evasion of third-party terms —
            compliance with each platform’s terms remains the user’s
            responsibility.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Our mission</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We want access to real mobile devices to be as simple as opening a tab
          in your browser — with transparency, reliability, and respect for the
          rules. We’re building the infrastructure so that teams of every size
          can test and develop on real hardware, without compromises and
          without needless complexity.
        </p>

        <div className="mt-12 flex flex-col items-start gap-4 border-t pt-10">
          <p className="leading-relaxed text-muted-foreground">
            Ready to try a real US device?
          </p>
          <Button
            size="lg"
            className="h-11 bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-6 text-white shadow-sm shadow-brand/25 hover:opacity-95"
            render={<Link href="/signup" />}
            nativeButton={false}
          >
            Get started
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
