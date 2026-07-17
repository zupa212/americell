"use client";

import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Separator } from "@/components/ui/separator";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { TELEGRAM_URL } from "@/lib/features";

type FooterLink = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "Why Cloud", href: "/why-cloud" },
      { label: "Use Cases", href: "/use-cases" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Root orchestrator: staggers the brand block + each column into view.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
// A larger, blur-dissolving reveal for hero-weight blocks (brand mark).
const block: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};
// A column acts as a nested orchestrator for its heading + links.
const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
// Subtle per-line reveal for headings and link rows.
const line: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const prefersReducedMotion = useReducedMotion();

  // Shared scroll-reveal wiring; omitted entirely under reduced-motion.
  const reveal = prefersReducedMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "0px 0px -80px 0px" as const },
      };

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
      {/* Flashy animated gradient hairline riding the top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px animate-gradient bg-gradient-to-r from-transparent via-brand to-transparent bg-[length:200%_auto]"
      />
      {/* Soft aurora glow blooming from the hairline for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(43,107,255,0.12),rgba(124,58,237,0.06)_45%,transparent_75%)]"
      />

      <h2 id="footer-heading" className="sr-only">
        {SITE.name} footer
      </h2>

      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8"
          variants={prefersReducedMotion ? undefined : container}
          {...reveal}
        >
          {/* Brand block */}
          <motion.div
            className="md:col-span-5"
            variants={prefersReducedMotion ? undefined : block}
          >
            <a
              href="#top"
              className="group inline-flex items-center gap-2.5 rounded-full text-foreground transition-all duration-300 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label={`${SITE.name} — back to top`}
            >
              {/* Brand mark */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/americell-mark.png"
                alt=""
                aria-hidden="true"
                width={464}
                height={260}
                className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
              />
              {/* Wordmark */}
              <span className="text-2xl font-bold tracking-tight">
                <AuroraText>{SITE.name}</AuroraText>
              </span>
            </a>

            {/* Bold one-line statement */}
            <p className="mt-5 max-w-sm text-balance text-xl leading-tight font-semibold tracking-tight text-foreground">
              Enterprise-grade remote phone infrastructure for secure mobile
              operations.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Cloud access to real, physical iPhones and Android devices — not
              emulators. We host, power, connect and maintain the fleet; you keep
              full control from one dashboard.
            </p>
          </motion.div>

          {/* Link columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7"
          >
            {COLUMNS.map((column) => (
              <motion.div
                key={column.heading}
                variants={prefersReducedMotion ? undefined : group}
              >
                <motion.h3
                  className="text-xs font-semibold tracking-[0.12em] text-brand uppercase"
                  variants={prefersReducedMotion ? undefined : line}
                >
                  {column.heading}
                </motion.h3>
                <ul role="list" className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <motion.li
                      key={link.label}
                      variants={prefersReducedMotion ? undefined : line}
                    >
                      <Link
                        href={link.href}
                        className="inline-block rounded-sm text-sm font-medium text-muted-foreground transition-all duration-300 hover:translate-x-0.5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </motion.div>

        {/* Honest use note — frosted glass card */}
        <motion.div
          className={cn(
            "group relative mt-12 rounded-3xl border border-white/50 bg-white/60 p-5 ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] backdrop-blur-xl",
            "transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
            "sm:mt-16 sm:p-6",
          )}
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 20, filter: "blur(6px)" },
                whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
                viewport: { once: true, margin: "0px 0px -60px 0px" as const },
                transition: { duration: 0.6, ease: EASE },
              })}
        >
          <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-white/50 bg-gradient-to-br from-brand/15 via-brand-2/15 to-brand-soft/15 text-brand backdrop-blur-md"
            >
              <ShieldCheck strokeWidth={2} className="h-5 w-5" />
            </span>
            <span>
              <span className="font-semibold text-foreground">{SITE.name}</span>{" "}
              is remote phone infrastructure for legitimate mobile operations.
              Your team is responsible for complying with the terms of any app or
              platform you run on the fleet.
            </span>
          </p>
        </motion.div>

        {/* Bottom row */}
        <Separator className="mt-12 bg-white/40 sm:mt-16" />
        <motion.div
          className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: "0px 0px -40px 0px" as const },
                transition: { duration: 0.5, ease: EASE },
              })}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-sm text-muted-foreground">
              &copy; {year} {SITE.name}.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE.name} on Telegram`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-[#229ED9]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Telegram
            </a>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Remote phone infrastructure for agencies, QA &amp; enterprise teams.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
