import Link from "next/link";
import PageShell from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Η σελίδα δεν βρέθηκε",
  description:
    "Η σελίδα που ψάχνεις δεν υπάρχει ή έχει μετακινηθεί. Επίστρεψε στην αρχική της Americell.",
  robots: { index: false, follow: false },
});

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center">
          <p className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
            404
          </p>
          <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
            Η σελίδα δεν βρέθηκε.
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Η σελίδα που ψάχνεις μπορεί να έχει μετακινηθεί, διαγραφεί ή να μην
            υπήρξε ποτέ.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 hover:opacity-95"
              render={<Link href="/" />}
              nativeButton={false}
            >
              Επιστροφή στην αρχική
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
