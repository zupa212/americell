import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Reveal from "@/components/ui/reveal";
import AuroraBackground from "@/components/ui/aurora-background";
import { Separator } from "@/components/ui/separator";
import { SITE } from "@/lib/site";

type FooterLink = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    heading: "Προϊόν",
    links: [
      { label: "Πώς λειτουργεί", href: "/#how" },
      { label: "Τιμές", href: "/#pricing" },
      { label: "Πελάτες", href: "/#clients" },
    ],
  },
  {
    heading: "Εταιρεία",
    links: [
      { label: "Σχετικά", href: "/about" },
      { label: "Επικοινωνία", href: "/contact" },
    ],
  },
  {
    heading: "Νομικά",
    links: [
      { label: "Όροι", href: "/terms" },
      { label: "Απόρρητο", href: "/privacy" },
      { label: "Αποδεκτή χρήση", href: "/acceptable-use" },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-labelledby="footer-heading"
      className="relative overflow-hidden border-t bg-background text-muted-foreground"
    >
      {/* Subtle aurora glow behind the footer */}
      <AuroraBackground className="opacity-70" />

      <h2 id="footer-heading" className="sr-only">
        Υποσέλιδο {SITE.name}
      </h2>

      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <Reveal className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand block */}
          <div className="md:col-span-5">
            <a
              href="#top"
              className="group inline-flex items-center gap-2.5 rounded-full text-foreground transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label={`${SITE.name} — επιστροφή στην κορυφή`}
            >
              {/* Brand mark */}
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-white shadow-md shadow-brand/25 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-brand/40"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
                  <path d="M11 18.5h2" />
                </svg>
              </span>
              {/* Wordmark */}
              <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-lg font-bold tracking-tight text-transparent">
                {SITE.name}
              </span>
            </a>

            {/* One-line description */}
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.tagline}
            </p>
          </div>

          {/* Link columns */}
          <nav
            aria-label="Υποσέλιδο"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7"
          >
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {column.heading}
                </h3>
                <ul role="list" className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="rounded-sm text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Reveal>

        {/* Honest use note */}
        <Reveal
          delay={0.05}
          className="group relative mt-12 rounded-xl border bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-brand/10 sm:mt-16 sm:p-6"
        >
          <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 via-brand-2/15 to-brand-soft/15 text-brand"
            >
              <ShieldCheck strokeWidth={2} className="h-5 w-5" />
            </span>
            <span>
              <span className="font-medium text-foreground">{SITE.name}</span>{" "}
              προορίζεται για νόμιμη χρήση πραγματικών συσκευών. Είσαι
              υπεύθυνος/η για τη συμμόρφωση με τους όρους κάθε εφαρμογής ή
              πλατφόρμας που χρησιμοποιείς.
            </span>
          </p>
        </Reveal>

        {/* Bottom row */}
        <Separator className="mt-12 sm:mt-16" />
        <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {year} {SITE.name}.
          </p>
          <p className="text-sm text-muted-foreground">
            Αληθινές συσκευές ΗΠΑ για πρακτορεία, δοκιμαστές εφαρμογών &amp;
            ομάδες ανάπτυξης.
          </p>
        </div>
      </div>
    </footer>
  );
}
