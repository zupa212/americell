import PageShell from "@/components/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Acceptable Use Policy",
  description:
    "Americell Acceptable Use Policy: permitted and prohibited uses of our real US devices, your responsibility for compliance, and the consequences of violations.",
  alternates: { canonical: "/acceptable-use" },
});

export default function AcceptableUsePage() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <Alert className="mb-8">
          <AlertTitle>Template copy</AlertTitle>
          <AlertDescription>
            This is template copy — to be reviewed by legal counsel before it
            goes live.
          </AlertDescription>
        </Alert>

        <h1 className="text-3xl font-bold sm:text-4xl">
          Acceptable Use Policy
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          This Acceptable Use Policy (the “Policy”) sets the rules for using the
          Americell service, which provides access to real, physical smartphones
          located in datacenters in the United States. Our goal is legitimate,
          transparent, and responsible use of the devices. By using the service,
          you accept the terms of this Policy.
        </p>

        <h2 className="mt-10 text-xl font-semibold">Scope</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          This Policy applies to every user, account, and device obtained
          through Americell, as well as to every action performed through our
          platform — whether manually from the browser or through automated
          workflows. It operates alongside our Terms of Service and Privacy
          Policy.
        </p>

        <h2 className="mt-10 text-xl font-semibold">Permitted uses</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Americell devices are intended for lawful, legitimate uses. By way of
          example and without limitation, the following are permitted:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Testing &amp; QA:</strong>{" "}
            testing apps and websites on real US devices, verifying
            compatibility, finding bugs, and running performance tests.
          </li>
          <li>
            <strong className="text-foreground">Localization:</strong>{" "}
            verifying content, pricing, translations, and user experience as
            they appear on a US location and network.
          </li>
          <li>
            <strong className="text-foreground">
              Managing your own accounts &amp; workflows:
            </strong>{" "}
            accessing and managing accounts that you legally own or for which
            you have explicit authorization, along with recurring tasks related
            to them.
          </li>
          <li>
            <strong className="text-foreground">Development:</strong> building,
            testing, and maintaining software, automations, and integrations
            that rely on real devices.
          </li>
          <li>
            Any other lawful business or personal use that respects this Policy,
            applicable law, and third-party terms.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Prohibited uses</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          You may not use Americell for any unlawful, fraudulent, or abusive
          activity. By way of example, the following are expressly prohibited:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Fraud:</strong> any form of
            deception, financial fraud, identity theft, payment tampering, or
            fraudulent acquisition of goods, services, or benefits.
          </li>
          <li>
            <strong className="text-foreground">Spam &amp; abuse:</strong> bulk
            sending of unsolicited messages, unwanted promotion, phishing, or
            distribution of malicious content.
          </li>
          <li>
            <strong className="text-foreground">
              Creating fake accounts:
            </strong>{" "}
            mass or automated creation of fake, bogus, or misleading accounts,
            as well as artificially inflating sign-ups, engagement, votes, or
            reviews.
          </li>
          <li>
            <strong className="text-foreground">
              Violating third-party terms:
            </strong>{" "}
            breaching the terms of service, policies, or technical protection
            measures of third-party apps, services, and platforms, as well as
            circumventing their security controls or restrictions.
          </li>
          <li>
            <strong className="text-foreground">Unlawful activity:</strong> any
            activity that violates applicable law, including infringement of
            intellectual property rights, unauthorized access to systems, and
            trafficking in illegal content.
          </li>
          <li>
            Accessing third-party accounts or data without explicit
            authorization, as well as surveilling or harassing individuals.
          </li>
          <li>
            Actions that harm, overload, or destabilize the infrastructure of
            Americell or of third-party networks.
          </li>
        </ul>

        <Separator className="my-10" />

        <h2 className="text-xl font-semibold">User responsibility</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          You are solely responsible for all actions performed through your
          account and devices. You must ensure that every use complies with
          applicable law (of the US and any other relevant jurisdiction), with
          the terms of the third parties whose services you use, and with this
          Policy. You must hold every necessary authorization, license, or right
          for the accounts, data, and content you manage. Americell is not
          liable for users’ misuse of the service.
        </p>

        <h2 className="mt-10 text-xl font-semibold">
          Consequences of violations
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          In the event of a violation of this Policy, Americell reserves the
          right, at its discretion and depending on the severity of the
          violation, to take one or more of the following actions:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>A warning and a request to correct the behavior immediately.</li>
          <li>
            Temporary suspension or restriction of access to devices or
            features.
          </li>
          <li>
            Permanent termination of the account without a refund for the
            remaining period.
          </li>
          <li>
            Notifying and cooperating with the competent authorities where
            required by law.
          </li>
          <li>
            Pursuing compensation for damages caused to Americell or to third
            parties.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Reporting abuse</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          If you become aware of any use of Americell that violates this Policy,
          contact us so we can investigate and take appropriate action. We
          encourage responsible reporting of incidents.
        </p>

        <h2 className="mt-10 text-xl font-semibold">Changes</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We may update this Policy to reflect changes to the service, the law,
          or our practices. Continued use of Americell after any changes
          constitutes acceptance of the revised Policy.
        </p>
      </article>
    </PageShell>
  );
}
