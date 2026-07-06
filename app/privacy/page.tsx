import PageShell from "@/components/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Americell collects, uses, and protects your personal data — GDPR rights, cookies, third-party providers, and security.",
  alternates: { canonical: "/privacy" },
});

/** Date the copy was last updated (update on each revision). */
const LAST_UPDATED = "July 1, 2026";

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <Alert className="mb-10">
          <AlertDescription>
            Template copy — to be reviewed by legal counsel.
          </AlertDescription>
        </Alert>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          This Privacy Policy describes how Americell (“we,” “us,” or “the
          Company”) collects, uses, stores, and protects your personal data when
          you use our service to legitimately access and control real, physical
          smartphones located in datacenters in the United States. We are
          committed to transparency and to respecting your rights under the
          General Data Protection Regulation (GDPR) and applicable law.
        </p>

        <Separator className="my-10" />

        <h2 className="mt-10 text-xl font-semibold">1. Data we collect</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We collect only the data necessary to provide and improve our service.
          Specifically:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Email address:</span>{" "}
            to create and verify your account, send notifications, and
            communicate about the service.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Account details:
            </span>{" "}
            name or company name, login details, and profile settings you choose
            to provide.
          </li>
          <li>
            <span className="font-medium text-foreground">Usage data:</span>{" "}
            technical information such as IP address, browser type, session
            times, in-dashboard actions, and diagnostic logs, so we can ensure
            security and correct operation.
          </li>
          <li>
            <span className="font-medium text-foreground">Payment data:</span>{" "}
            payments are processed through our provider, Stripe. We do not store
            full card details on our servers; we receive only limited
            information from Stripe (e.g. subscription status, last four digits,
            expiration date) to manage billing.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">2. How we use data</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We use your data for the following purposes:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>To provide, operate, and maintain the service.</li>
          <li>To manage your account, subscription, and payments.</li>
          <li>
            For security, fraud prevention, and detection of abusive or unlawful
            use.
          </li>
          <li>
            To improve performance, analyze usage, and develop new features.
          </li>
          <li>
            To communicate with you about updates, support, and important
            changes to the service.
          </li>
          <li>
            To comply with our legal obligations and the terms of third-party
            providers.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          The service is intended solely for legitimate use of real devices in
          the US. We do not use your data to facilitate fraud, circumvent rules,
          or violate the terms of third-party services.
        </p>

        <h2 className="mt-10 text-xl font-semibold">3. Cookies</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We use cookies and similar technologies to keep your session active,
          remember your preferences, and understand how the service is used.
          Strictly necessary cookies are essential for the platform to function,
          while optional cookies (e.g. analytics) are used only with your
          consent. You can manage or disable cookies through your browser
          settings, though some features may become unavailable.
        </p>

        <h2 className="mt-10 text-xl font-semibold">
          4. Third-party providers
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We work with trusted third-party providers that process data on our
          behalf under strict contractual commitments:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Stripe:</span> for
            secure payment processing and subscription management. Its own
            privacy policy applies.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Hosting and infrastructure providers:
            </span>{" "}
            for hosting the platform, storing data, and operating the
            datacenters in which the devices are located.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We do not sell your personal data. We share data with third parties
          only to the extent required to provide the service or when required by
          law.
        </p>

        <h2 className="mt-10 text-xl font-semibold">
          5. Your rights (GDPR)
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          If you are subject to the GDPR, you have the following rights
          regarding your personal data:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Access:</span> to
            request a copy of the data we hold about you.
          </li>
          <li>
            <span className="font-medium text-foreground">Rectification:</span>{" "}
            to request correction of inaccurate or incomplete data.
          </li>
          <li>
            <span className="font-medium text-foreground">Erasure:</span> to
            request deletion of your data (the “right to be forgotten”), where
            no legal obligation to retain it exists.
          </li>
          <li>
            <span className="font-medium text-foreground">Portability:</span> to
            receive your data in a structured, commonly used, machine-readable
            format.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Restriction and objection:
            </span>{" "}
            to request restriction of or object to processing, and to withdraw
            your consent at any time.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          To exercise your rights, contact us using the details below. You also
          have the right to lodge a complaint with the competent data protection
          supervisory authority.
        </p>

        <h2 className="mt-10 text-xl font-semibold">6. Security</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We apply appropriate technical and organizational measures to protect
          your data, such as encryption in transit, access control, device
          isolation, and regular security monitoring. Although no method of
          transmission or storage is completely secure, we are committed to
          protecting your data in line with current industry standards.
        </p>

        <h2 className="mt-10 text-xl font-semibold">7. Data retention</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We retain your personal data only for as long as necessary for the
          purposes for which it was collected, to fulfill our legal, tax, and
          accounting obligations, or to resolve disputes. When data is no longer
          needed, we securely delete or anonymize it.
        </p>

        <h2 className="mt-10 text-xl font-semibold">8. Contact</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          For any questions about this Privacy Policy or to exercise your
          rights, you can contact us at{" "}
          <a
            href="mailto:privacy@americell.example"
            className="text-brand underline underline-offset-4"
          >
            privacy@americell.example
          </a>
          . We will respond to your request within the timeframes set by
          applicable law.
        </p>

        <Separator className="my-10" />

        <p className="text-sm text-muted-foreground">
          We may update this Privacy Policy from time to time. Any material
          change will be announced through the service or by email, and the last
          updated date at the top of the page will be revised accordingly.
        </p>
      </article>
    </PageShell>
  );
}
