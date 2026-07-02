import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Reveal from "@/components/ui/reveal";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
      className={cn(
        // Transparent section wrapper so the global aurora shows through,
        // with a frosted top edge floating over the colorful background.
        "relative border-t border-white/40 bg-white/40 text-muted-foreground backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-white/40",
      )}
    >
      <h2 id="footer-heading" className="sr-only">
        Υποσέλιδο {SITE.name}
      </h2>

      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <Reveal className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand block */}
          <div className="md:col-span-5">
            <a
              href="#top"
              className="group inline-flex items-center gap-2.5 rounded-full text-foreground transition-all duration-300 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label={`${SITE.name} — επιστροφή στην κορυφή`}
            >
              {/* Brand mark */}
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-white shadow-md shadow-brand/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-brand/40"
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
                        className="rounded-sm text-sm text-muted-foreground transition-all duration-300 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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

        {/* Honest use note — frosted glass card */}
        <Reveal
          delay={0.05}
          className={cn(
            "group relative mt-12 rounded-3xl border border-white/50 bg-white/60 p-5 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
            "transition-all duration-300 hover:bg-white/70 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
            "sm:mt-16 sm:p-6",
          )}
        >
          <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-white/50 bg-gradient-to-br from-brand/15 via-brand-2/15 to-brand-soft/15 text-brand backdrop-blur-md"
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
        <Separator className="mt-12 bg-white/40 sm:mt-16" />
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
