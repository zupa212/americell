import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Americell Terms of Service: accounts, acceptable use, subscriptions and billing, intellectual property, limitation of liability, and termination.",
  alternates: { canonical: "/terms" },
});

/**
 * Terms of Service — template legal copy for the Americell marketing site.
 *
 * This is boilerplate, honestly-positioned copy that must be reviewed by a
 * lawyer before going live. Positioning stays truthful: legitimate use of real
 * US devices, no fraud or rule circumvention, compliance with third-party terms.
 */
export default function TermsPage() {
  const lastUpdated = "July 1, 2026";

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <Alert className="mb-10">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Template copy — to be reviewed by legal counsel.
          </AlertDescription>
        </Alert>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          Welcome to {SITE.name}. These Terms of Service (the “Terms”) govern
          your access to and use of our platform, website, and services
          (collectively, the “Service”). By using the Service, you agree to
          these Terms. If you do not agree with any part of them, please do not
          use the Service.
        </p>

        <section>
          <h2 className="mt-10 text-xl font-semibold">1. Introduction</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {SITE.name} provides remote access to real, physical smartphones
            hosted in US datacenters. The Service is intended for legitimate
            use: mobile app testing and QA, US-localized testing, app store
            review, and managing your own accounts and workflows.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            These Terms form a binding agreement between you (or the
            organization you represent) and {SITE.name}. To use the Service you
            must be at least 18 years old and have the legal capacity to enter
            into a contract.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            2. Accounts &amp; access
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Accessing the Service requires creating an account. You are
            responsible for the accuracy of the information you provide and for
            keeping it up to date.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              You must safeguard the confidentiality of your credentials and are
              responsible for all activity that takes place through your
              account.
            </li>
            <li>
              Notify us immediately if you become aware of any unauthorized use
              of your account or any breach of security.
            </li>
            <li>
              You may not share your access in a way that circumvents the seat
              or device limits of your plan.
            </li>
            <li>
              We reserve the right to suspend accounts that show suspicious or
              unauthorized activity.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">3. Acceptable use</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms. Using the Service for fraud, for
            circumventing third-party rules or security measures, or for any
            activity that violates the terms of the apps or platforms you use on
            the devices is expressly prohibited.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            You are solely responsible for your compliance with the terms of any
            third-party app or platform. The full rules are described in our{" "}
            <Link
              href="/acceptable-use"
              className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
            >
              Acceptable Use Policy
            </Link>
            , which forms an integral part of these Terms.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            4. Subscriptions &amp; billing
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The Service is offered on per-device subscription plans. By
            selecting a plan, you authorize {SITE.name} to charge your chosen
            payment method on a recurring basis until you cancel.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Monthly billing:
              </span>{" "}
              the subscription renews automatically each month and is charged at
              the start of each billing period.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Annual billing:
              </span>{" "}
              the subscription renews automatically each year, at a reduced cost
              compared to the equivalent monthly billing.
            </li>
            <li>
              <span className="font-medium text-foreground">Cancellation:</span>{" "}
              you can cancel at any time from your dashboard. Cancellation takes
              effect at the end of the current billing period — you keep access
              until then.
            </li>
            <li>
              Prices are exclusive of taxes unless stated otherwise. Payments
              are non-refundable except where required by law or expressly
              provided.
            </li>
            <li>
              We may modify our prices; any changes will apply from the next
              renewal period, with prior notice.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            5. Intellectual property
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The Service, software, design, logos, and all related content are
            the property of {SITE.name} or its licensors and are protected by
            copyright and trademark law.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            You are granted a limited, non-exclusive, non-transferable license
            to use the Service in accordance with these Terms. You retain
            ownership of the content and data you provide, while granting us the
            limited license needed to operate the Service. You may not copy,
            modify, reverse-engineer, or create derivative works without our
            prior written consent.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            6. Limitation of liability
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The Service is provided “as is” and “as available,” without
            warranties of any kind, express or implied. We do not warrant that
            the Service will be uninterrupted, secure, or error-free.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            To the maximum extent permitted by law, {SITE.name} shall not be
            liable for any indirect, incidental, special, or consequential
            damages, nor for loss of profits, data, or goodwill, arising from
            your use of or inability to use the Service. Our total liability is
            limited to the amount you paid for the Service during the twelve
            months preceding the event giving rise to the liability.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">7. Termination</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            You may terminate your account at any time. We reserve the right to
            suspend or terminate your access to the Service, with or without
            notice, if you violate these Terms or the Acceptable Use Policy, if
            we detect fraudulent or unlawful activity, or if required by law.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Upon termination, your right to use the Service ceases immediately.
            Terms that by their nature should survive — such as intellectual
            property, limitation of liability, and applicable legal provisions —
            remain in effect after termination.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">8. Changes</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We may update these Terms from time to time. In the event of
            material changes, we will notify you by reasonable means — for
            example, by email or with an in-Service notice — before they take
            effect. Continued use of the Service after the update constitutes
            acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">9. Contact</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            For any questions about these Terms, you can reach us through our{" "}
            <Link
              href="/contact"
              className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
            >
              contact page
            </Link>
            . We’re happy to help.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
