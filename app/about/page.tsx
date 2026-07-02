import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Σχετικά με το Americell",
  description:
    "Το Americell σού δίνει πρόσβαση σε αληθινά smartphone ΗΠΑ που ελέγχεις από τον browser σου. Μάθε τι είναι, για ποιους φτιάχτηκε, τις αξίες μας και την αποστολή μας.",
  alternates: { canonical: "/about" },
});

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Σχετικά με το{" "}
          <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
            Americell
          </span>
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Το Americell είναι μια πλατφόρμα που σου δίνει πρόσβαση σε αληθινά,
          φυσικά smartphone τοποθετημένα σε datacenter στις ΗΠΑ — και σου
          επιτρέπει να τα χειρίζεσαι ζωντανά, απευθείας από τον browser σου,
          από οπουδήποτε στον κόσμο.
        </p>

        <h2 className="mt-10 text-xl font-semibold">Τι είναι το Americell</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Δεν πρόκειται για emulator ούτε για εικονική συσκευή. Πίσω από κάθε
          σύνδεση υπάρχει μια πραγματική συσκευή, με πραγματικό λειτουργικό,
          πραγματικό δίκτυο και πραγματική συμπεριφορά. Εσύ βλέπεις την οθόνη
          της σε πραγματικό χρόνο και τη χειρίζεσαι σαν να την κρατούσες στα
          χέρια σου.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Αληθινά τηλέφωνα ΗΠΑ — φυσικές συσκευές που τρέχουν σε υποδομή στις
            Ηνωμένες Πολιτείες.
          </li>
          <li>
            Τηλεχειρισμός από τον browser — χωρίς εγκαταστάσεις, χωρίς καλώδια,
            χωρίς εξειδικευμένο εξοπλισμό.
          </li>
          <li>
            Ζωντανή αλληλεπίδραση και δυνατότητα αυτοματοποίησης
            επαναλαμβανόμενων ροών σε έναν ολόκληρο στόλο συσκευών.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Για ποιους φτιάχτηκε</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Το Americell απευθύνεται σε ομάδες και επαγγελματίες που χρειάζονται
          πρόσβαση σε αληθινές συσκευές ΗΠΑ, χωρίς να συντηρούν δικό τους
          hardware.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Πρακτορεία που διαχειρίζονται λογαριασμούς και ροές εργασίας για
            πελάτες τους.
          </li>
          <li>
            Δοκιμαστές εφαρμογών (QA) που θέλουν να επιβεβαιώσουν τη
            συμπεριφορά σε πραγματικές συσκευές και συνθήκες δικτύου.
          </li>
          <li>
            Ομάδες ανάπτυξης που χτίζουν, ελέγχουν και αυτοματοποιούν
            εφαρμογές κινητού σε αληθινό περιβάλλον.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Οι αξίες μας</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">
              Αληθινό hardware.
            </span>{" "}
            Δουλεύεις πάντα με πραγματικές συσκευές — όχι με προσομοιώσεις που
            κρύβουν αποκλίσεις.
          </li>
          <li>
            <span className="font-medium text-foreground">Διαφάνεια.</span>{" "}
            Ξέρεις τι ελέγχεις, πού βρίσκεται η συσκευή και πώς λειτουργεί η
            υπηρεσία. Χωρίς κρυφές χρεώσεις ή θολά όρια.
          </li>
          <li>
            <span className="font-medium text-foreground">Νόμιμη χρήση.</span>{" "}
            Στηρίζουμε αποκλειστικά τη νόμιμη χρήση των συσκευών. Δεν
            διευκολύνουμε απάτη, παράκαμψη κανόνων ή καταστρατήγηση των όρων
            τρίτων υπηρεσιών — η συμμόρφωση με τους όρους κάθε πλατφόρμας
            παραμένει ευθύνη του χρήστη.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Η αποστολή μας</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Θέλουμε η πρόσβαση σε αληθινές κινητές συσκευές να είναι τόσο απλή
          όσο το άνοιγμα μιας καρτέλας στον browser — με διαφάνεια, αξιοπιστία
          και σεβασμό στους κανόνες. Χτίζουμε την υποδομή ώστε ομάδες κάθε
          μεγέθους να δοκιμάζουν, να αναπτύσσουν και να αυτοματοποιούν πάνω σε
          πραγματικό hardware, χωρίς συμβιβασμούς και χωρίς περιττή
          πολυπλοκότητα.
        </p>

        <div className="mt-12 flex flex-col items-start gap-4 border-t pt-10">
          <p className="leading-relaxed text-muted-foreground">
            Έτοιμος να δοκιμάσεις μια αληθινή συσκευή ΗΠΑ;
          </p>
          <Button
            size="lg"
            className="h-11 bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-6 text-white shadow-sm shadow-brand/25 hover:opacity-95"
            render={<Link href="/signup" />}
            nativeButton={false}
          >
            Ξεκίνα τώρα
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
