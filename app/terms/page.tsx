import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Όροι Χρήσης",
  description:
    "Οι Όροι Χρήσης της Americell: λογαριασμοί, αποδεκτή χρήση, συνδρομές και χρεώσεις, πνευματική ιδιοκτησία, περιορισμός ευθύνης και τερματισμός.",
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
  const lastUpdated = "1 Ιουλίου 2026";

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <Alert className="mb-10">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Πρότυπο κείμενο — να ελεγχθεί από νομικό σύμβουλο.
          </AlertDescription>
        </Alert>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Όροι Χρήσης
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Τελευταία ενημέρωση: {lastUpdated}
        </p>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          Καλώς όρισες στην {SITE.name}. Οι παρόντες Όροι Χρήσης («Όροι»)
          διέπουν την πρόσβαση και τη χρήση της πλατφόρμας, του ιστότοπου και
          των υπηρεσιών μας (συλλογικά, η «Υπηρεσία»). Χρησιμοποιώντας την
          Υπηρεσία, αποδέχεσαι τους παρόντες Όρους. Αν δεν συμφωνείς με
          οποιοδήποτε μέρος τους, παρακαλούμε μην χρησιμοποιείς την Υπηρεσία.
        </p>

        <section>
          <h2 className="mt-10 text-xl font-semibold">1. Εισαγωγή</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Η {SITE.name} παρέχει απομακρυσμένη πρόσβαση σε αληθινές, φυσικές
            συσκευές smartphone που φιλοξενούνται σε datacenters των ΗΠΑ. Η
            Υπηρεσία προορίζεται για νόμιμη χρήση: δοκιμές και QA εφαρμογών για
            κινητά, τοπικοποιημένο testing στις ΗΠΑ, έλεγχο στα app stores και
            διαχείριση των δικών σου λογαριασμών και ροών εργασίας.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Οι παρόντες Όροι αποτελούν δεσμευτική συμφωνία ανάμεσα σε εσένα (ή
            τον οργανισμό που εκπροσωπείς) και την {SITE.name}. Για να
            χρησιμοποιήσεις την Υπηρεσία πρέπει να είσαι τουλάχιστον 18 ετών και
            να έχεις τη δικαιοπρακτική ικανότητα να συνάπτεις σύμβαση.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            2. Λογαριασμοί &amp; πρόσβαση
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Για την πρόσβαση στην Υπηρεσία απαιτείται η δημιουργία λογαριασμού.
            Είσαι υπεύθυνος/η για την ακρίβεια των στοιχείων που παρέχεις και για
            τη διατήρησή τους ενημερωμένων.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Οφείλεις να διαφυλάσσεις την εμπιστευτικότητα των διαπιστευτηρίων
              σου και είσαι υπεύθυνος/η για κάθε δραστηριότητα που πραγματοποιείται
              μέσω του λογαριασμού σου.
            </li>
            <li>
              Ειδοποίησέ μας αμέσως αν υποπέσει στην αντίληψή σου μη
              εξουσιοδοτημένη χρήση του λογαριασμού σου ή οποιαδήποτε παραβίαση
              ασφαλείας.
            </li>
            <li>
              Δεν επιτρέπεται να μοιράζεσαι την πρόσβασή σου με τρόπο που παρακάμπτει
              τα όρια θέσεων ή τα όρια συσκευών του πλάνου σου.
            </li>
            <li>
              Διατηρούμε το δικαίωμα να αναστείλουμε λογαριασμούς που εμφανίζουν
              ύποπτη ή μη εξουσιοδοτημένη δραστηριότητα.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">3. Αποδεκτή χρήση</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Δεσμεύεσαι να χρησιμοποιείς την Υπηρεσία μόνο για νόμιμους σκοπούς και
            σύμφωνα με τους παρόντες Όρους. Απαγορεύεται ρητά η χρήση της Υπηρεσίας
            για απάτη, για παράκαμψη κανόνων ή μέτρων ασφαλείας τρίτων, καθώς και
            για οποιαδήποτε ενέργεια που παραβιάζει τους όρους των εφαρμογών ή των
            πλατφορμών που χρησιμοποιείς στις συσκευές.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Είσαι αποκλειστικά υπεύθυνος/η για τη συμμόρφωσή σου με τους όρους κάθε
            τρίτης εφαρμογής ή πλατφόρμας. Οι πλήρεις κανόνες περιγράφονται στην{" "}
            <Link
              href="/acceptable-use"
              className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
            >
              Πολιτική Αποδεκτής Χρήσης
            </Link>
            , η οποία αποτελεί αναπόσπαστο μέρος των παρόντων Όρων.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            4. Συνδρομές &amp; χρεώσεις
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Η Υπηρεσία προσφέρεται με συνδρομητικά πλάνα ανά συσκευή. Επιλέγοντας
            ένα πλάνο, εξουσιοδοτείς την {SITE.name} να χρεώνει τον επιλεγμένο
            τρόπο πληρωμής σου σε επαναλαμβανόμενη βάση, έως ότου ακυρώσεις.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Μηνιαία χρέωση:
              </span>{" "}
              η συνδρομή ανανεώνεται αυτόματα κάθε μήνα και χρεώνεται στην αρχή
              κάθε περιόδου χρέωσης.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Ετήσια χρέωση:
              </span>{" "}
              η συνδρομή ανανεώνεται αυτόματα κάθε έτος, με μειωμένο κόστος σε
              σύγκριση με την αντίστοιχη μηνιαία χρέωση.
            </li>
            <li>
              <span className="font-medium text-foreground">Ακύρωση:</span>{" "}
              μπορείς να ακυρώσεις ανά πάσα στιγμή από το dashboard σου. Η
              ακύρωση ισχύει στο τέλος της τρέχουσας περιόδου χρέωσης — διατηρείς
              πρόσβαση μέχρι τότε.
            </li>
            <li>
              Οι τιμές δεν περιλαμβάνουν φόρους, εκτός αν αναφέρεται διαφορετικά.
              Οι πληρωμές είναι μη επιστρεπτέες, εκτός αν απαιτείται από τον νόμο
              ή προβλέπεται ρητά.
            </li>
            <li>
              Ενδέχεται να τροποποιήσουμε τις τιμές μας· τυχόν αλλαγές θα ισχύουν
              από την επόμενη περίοδο ανανέωσης, με προηγούμενη ειδοποίηση.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            5. Πνευματική ιδιοκτησία
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Η Υπηρεσία, το λογισμικό, ο σχεδιασμός, τα λογότυπα και όλο το
            σχετικό περιεχόμενο αποτελούν ιδιοκτησία της {SITE.name} ή των
            δικαιοπαρόχων της και προστατεύονται από τη νομοθεσία περί
            πνευματικής ιδιοκτησίας και εμπορικών σημάτων.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Σου παραχωρείται μια περιορισμένη, μη αποκλειστική, μη μεταβιβάσιμη
            άδεια χρήσης της Υπηρεσίας σύμφωνα με τους παρόντες Όρους. Διατηρείς
            την κυριότητα του περιεχομένου και των δεδομένων που παρέχεις εσύ,
            ενώ μας παραχωρείς την περιορισμένη άδεια που χρειάζεται για τη
            λειτουργία της Υπηρεσίας. Δεν επιτρέπεται η αντιγραφή, τροποποίηση,
            αντίστροφη μηχανική ή δημιουργία παράγωγων έργων χωρίς προηγούμενη
            γραπτή συγκατάθεσή μας.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">
            6. Περιορισμός ευθύνης
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Η Υπηρεσία παρέχεται «ως έχει» και «ως διατίθεται», χωρίς εγγυήσεις
            οποιουδήποτε είδους, ρητές ή σιωπηρές. Δεν εγγυόμαστε ότι η Υπηρεσία
            θα είναι αδιάλειπτη, ασφαλής ή απαλλαγμένη από σφάλματα.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Στον μέγιστο βαθμό που επιτρέπει ο νόμος, η {SITE.name} δεν ευθύνεται
            για έμμεσες, παρεπόμενες, ειδικές ή αποθετικές ζημίες, ούτε για
            απώλεια κερδών, δεδομένων ή φήμης, που προκύπτουν από τη χρήση ή την
            αδυναμία χρήσης της Υπηρεσίας. Η συνολική μας ευθύνη περιορίζεται στο
            ποσό που κατέβαλες για την Υπηρεσία κατά τους δώδεκα μήνες που
            προηγήθηκαν του γεγονότος που γεννά την ευθύνη.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">7. Τερματισμός</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Μπορείς να τερματίσεις τον λογαριασμό σου ανά πάσα στιγμή. Διατηρούμε
            το δικαίωμα να αναστείλουμε ή να τερματίσουμε την πρόσβασή σου στην
            Υπηρεσία, με ή χωρίς ειδοποίηση, εάν παραβιάσεις τους παρόντες Όρους ή
            την Πολιτική Αποδεκτής Χρήσης, εάν εντοπίσουμε δόλια ή παράνομη
            δραστηριότητα, ή εάν απαιτείται από τον νόμο.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Μετά τον τερματισμό, το δικαίωμα χρήσης της Υπηρεσίας παύει άμεσα.
            Όροι που από τη φύση τους οφείλουν να παραμείνουν σε ισχύ — όπως η
            πνευματική ιδιοκτησία, ο περιορισμός ευθύνης και οι εφαρμοστέες
            νομικές διατάξεις — εξακολουθούν να ισχύουν και μετά τον τερματισμό.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">8. Τροποποιήσεις</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Ενδέχεται να επικαιροποιούμε τους παρόντες Όρους κατά διαστήματα. Σε
            περίπτωση ουσιωδών αλλαγών, θα σε ειδοποιήσουμε με εύλογο τρόπο —
            για παράδειγμα μέσω email ή με ανακοίνωση εντός της Υπηρεσίας — πριν
            τεθούν σε ισχύ. Η συνέχιση της χρήσης της Υπηρεσίας μετά την
            ενημέρωση συνιστά αποδοχή των αναθεωρημένων Όρων.
          </p>
        </section>

        <section>
          <h2 className="mt-10 text-xl font-semibold">9. Επικοινωνία</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Για οποιαδήποτε απορία σχετικά με τους παρόντες Όρους, μπορείς να
            επικοινωνήσεις μαζί μας μέσω της{" "}
            <Link
              href="/contact"
              className="font-medium text-brand underline underline-offset-4 transition hover:opacity-80"
            >
              σελίδας επικοινωνίας
            </Link>
            . Θα χαρούμε να σε βοηθήσουμε.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
