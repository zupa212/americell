import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Επικοινωνία",
  description:
    "Επικοινώνησε με την ομάδα της Americell για ερωτήσεις σχετικά με τη νόμιμη χρήση πραγματικών συσκευών ΗΠΑ, τιμολόγηση ή υποστήριξη.",
  alternates: { canonical: "/contact" },
});

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold sm:text-4xl">Επικοινωνία</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Έχεις μια ερώτηση για την Americell; Στείλε μας μήνυμα και θα σου
          απαντήσουμε το συντομότερο δυνατό. Χαιρόμαστε να συζητήσουμε τη νόμιμη
          χρήση πραγματικών smartphone ΗΠΑ, την τιμολόγηση ή οτιδήποτε άλλο σε
          απασχολεί.
        </p>

        <ContactForm />

        <h2 className="mt-10 text-xl font-semibold">Τι μπορούμε να καλύψουμε</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Ερωτήσεις για τη νόμιμη χρήση πραγματικών συσκευών ΗΠΑ σε datacenter
            ΗΠΑ.
          </li>
          <li>Τιμολόγηση, χρεώσεις και επιλογές συνδρομής.</li>
          <li>Τεχνική υποστήριξη και ενσωμάτωση με τις ροές σου.</li>
          <li>
            Συμμόρφωση με τους όρους τρίτων — δεν υποστηρίζουμε απάτη ούτε
            παράκαμψη κανόνων.
          </li>
        </ul>
      </div>
    </PageShell>
  );
}
