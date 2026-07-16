import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Refund Policy",
  description:
    "Americell Refund Policy: no setup fees, per-device monthly billing, cancel anytime from your dashboard, what happens on cancellation, and included hardware maintenance.",
  alternates: { canonical: "/refund" },
  robots: { index: true, follow: true },
});

/**
 * Refund Policy — template legal copy for the Americell marketing site.
 *
 * Boilerplate, honestly-positioned copy to be reviewed by legal counsel before
 * going live. Positioning stays truthful: transparent per-device pricing, no
 * setup fees, self-serve cancellation, and hardware maintenance included.
 */
export default function RefundPage() {
  const lastUpdated = "July 1, 2026";

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-24">
        <Alert className="mb-10">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Template copy — to be reviewed by legal counsel.
          </AlertDescription>
        </Alert>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Refund Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          This Refund Policy explains how billing, cancellation, and refunds
          work for {SITE.name}. Our aim is to keep pricing transparent and
          predictable: you pay for the devices you run, month to month, with no
          setup fees and no long-term lock-in. This policy forms part of, and
          should be read alongside, our{" "}
          <Link
            href="/terms"
            className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
          >
            Terms of Service
          </Link>
          .
        </p>

        <section>
          <h2 className="mt-10 text-xl font-semibold">1. No setup fees</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            There are no onboarding, activation, or setup fees to start using{" "}
            {SITE.name}. You are never charged to provision a device, connect to
            a session, or configure your dashboard. The only thing you pay is
            your recurring per-device subscription.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            2. Per-device monthly billing
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The Service is billed per device on a recurring monthly basis. Each
            device you add to your fleet is charged at the start of its billing
            period, and your subscription renews automatically each month until
            you cancel.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Transparent pricing:
              </span>{" "}
              hosting, power, connectivity, and platform access are included in
              the per-device price — no hidden line items.
            </li>
            <li>
              <span className="font-medium text-foreground">Scale on demand:</span>{" "}
              add or remove devices from the dashboard at any time. New devices
              begin their own billing period when provisioned.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Optional add-ons:
              </span>{" "}
              extras such as dedicated SIM data plans are billed on the same
              per-device monthly cycle and are shown clearly before you enable
              them.
            </li>
            <li>
              Prices are exclusive of taxes unless stated otherwise. Any price
              change applies only from your next renewal period, with prior
              notice.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            3. Cancel anytime from your dashboard
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            You are never locked into a contract. You can cancel any device, or
            your entire subscription, at any time and self-serve directly from
            your {SITE.name} dashboard — no phone call, no cancellation fee, and
            no email ticket required.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Cancellation stops the automatic renewal of the affected devices.
            You are not charged for any billing period that begins after you
            cancel.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            4. What happens on cancellation
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            When you cancel, the change takes effect at the end of the current
            billing period. You keep full access to the device and its data
            until that period ends, so nothing is cut off mid-cycle.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Access until period end:
              </span>{" "}
              your device stays live and controllable through the remainder of
              the month you have already paid for.
            </li>
            <li>
              <span className="font-medium text-foreground">
                No further charges:
              </span>{" "}
              the subscription for that device will not renew, and no additional
              invoices are generated for it.
            </li>
            <li>
              <span className="font-medium text-foreground">Your data:</span>{" "}
              export or remove any data you need before the period ends. After
              the device is released, its session data is decommissioned in line
              with our{" "}
              <Link
                href="/privacy"
                className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
              >
                Privacy Policy
              </Link>
              .
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Because billing is monthly and access continues to the end of the
            paid period, partial-month refunds are generally not issued. Where a
            refund is required by applicable law, or where we have billed you in
            error, we will of course make it right — contact us and we will
            resolve it promptly.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            5. Hardware maintenance &amp; replacement included
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Your per-device price covers the upkeep of the physical hardware.
            Routine maintenance, and the repair or replacement of a failed
            device, are included at no extra cost — you are never billed
            separately for hardware issues on our side.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            If a device becomes unavailable due to a hardware fault, we work to
            restore or swap it as part of the Service. Because maintenance and
            replacement are covered by your subscription rather than one-off
            charges, there is nothing to refund for hardware upkeep.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            6. Enterprise &amp; DPA
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Enterprise agreements may set out custom billing terms — such as
            annual commitments, volume pricing, or invoicing arrangements —
            along with a Data Processing Agreement (DPA). Where the terms of a
            signed enterprise contract or DPA differ from this policy, those
            terms govern.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            To scope an enterprise deployment, custom terms, or a DPA,{" "}
            <Link
              href="/contact"
              className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
            >
              talk to Sales
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">7. Contact</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Questions about billing, cancellation, or a specific charge? Reach
            us through our{" "}
            <Link
              href="/contact"
              className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
            >
              contact page
            </Link>{" "}
            and we will be glad to help.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
