import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the Americell team about legitimate use of real US devices, pricing, or support.",
  alternates: { canonical: "/contact" },
});

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold sm:text-4xl">Contact</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Have a question about Americell? Send us a message and we’ll get back
          to you as soon as we can. We’re happy to talk through legitimate use
          of real US smartphones, pricing, or anything else on your mind.
        </p>

        <ContactForm />

        <h2 className="mt-10 text-xl font-semibold">What we can help with</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Questions about legitimate use of real US devices in US
            datacenters.
          </li>
          <li>Pricing, billing, and subscription options.</li>
          <li>Technical support and integration with your workflows.</li>
          <li>
            Compliance with third-party terms — we do not support fraud or rule
            circumvention.
          </li>
        </ul>
      </div>
    </PageShell>
  );
}
