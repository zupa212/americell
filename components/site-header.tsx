"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Globe, Menu } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE } from "@/lib/site";
import { AuroraText } from "@/components/ui/aurora-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

/**
 * SiteHeader — a FLOATING, fully-rounded glassmorphism pill nav (Apple-style)
 * with buttery motion.
 *
 * The bar is a detached `rounded-full` frosted-glass pill that never touches the
 * top edge. It smoothly hides on scroll-down and reveals on scroll-up
 * (`useScroll` + `useMotionValueEvent`), and tightens its shadow/opacity once the
 * page moves. Nav items share a single spring-animated "magnetic" pill
 * (`layoutId`) that glides to whatever is hovered/active. Brand + AuroraText
 * wordmark on the left; shadcn NavigationMenu in the center (md+); language
 * DropdownMenu + Log in + a Magic UI ShimmerButton "Get started" CTA on the
 * right; a hamburger-triggered Sheet on mobile with staggered items.
 *
 * All motion honors `prefers-reduced-motion` and animates transform/opacity only.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LANGUAGES = ["English"] as const;
const BRAND_GRADIENT =
  "linear-gradient(110deg, #2b6bff 0%, #7c3aed 45%, #5aa2ff 100%)";

// The three enterprise product pages, surfaced in the primary nav.
const PRODUCT_LINKS: { label: string; href: string }[] = [
  { label: "Platform", href: "/platform" },
  { label: "Why Cloud", href: "/why-cloud" },
  { label: "Use Cases", href: "/use-cases" },
];

// Primary nav = existing site links with the product pages inserted right
// after Home, so the product story leads and the anchor + blog links follow.
// Derived from NAV_LINKS so it never drifts from lib/site.
const PRIMARY_NAV: { label: string; href: string }[] = [
  ...NAV_LINKS.slice(0, 1),
  ...PRODUCT_LINKS,
  ...NAV_LINKS.slice(1),
];

const mobileList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const mobileItem: Variants = {
  hidden: { opacity: 0, x: 18 },
  show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } },
};

export default function SiteHeader() {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const lastY = useRef(0);

  // Buttery hide-on-scroll-down / reveal-on-scroll-up driven by the scroll MV.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
    const previous = lastY.current;
    if (!menuOpen) {
      if (latest > 140 && latest > previous + 6) setHidden(true);
      else if (latest < previous - 6) setHidden(false);
    }
    lastY.current = latest;
  });

  // Exact-match active section (Home on "/", Blog on "/blog"); the shared pill
  // rests here whenever nothing is hovered.
  const activeHref =
    PRIMARY_NAV.find((link) => link.href === pathname)?.href ?? null;
  const highlighted = hovered ?? activeHref;
  const shouldHide = hidden && !menuOpen && !prefersReducedMotion;

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        className="mx-auto w-full max-w-6xl px-4 pt-3 sm:pt-4"
        initial={prefersReducedMotion ? false : { y: -80, opacity: 0 }}
        animate={{ y: shouldHide ? -120 : 0, opacity: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 320, damping: 34, mass: 0.9 }
        }
      >
        <div
          className={cn(
            "flex h-14 items-center justify-between gap-1.5 rounded-full border border-white/50 pl-4 pr-2 sm:gap-2 sm:pl-5",
            "bg-white/55 ring-1 ring-white/50 backdrop-blur-2xl backdrop-saturate-150",
            "transition-[background-color,box-shadow] duration-300",
            scrolled
              ? "bg-white/70 shadow-[0_16px_50px_-16px_rgba(30,41,120,0.38)]"
              : "shadow-[0_10px_40px_-14px_rgba(30,41,120,0.28)]",
          )}
        >
          {/* Brand */}
          <a
            href="/"
            className="group flex items-center gap-2.5 rounded-full outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${SITE.name} — Home`}
          >
            <span
              aria-hidden="true"
              className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] text-base font-bold text-white shadow-sm shadow-brand/20 ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105 group-hover:animate-gradient"
            >
              <span className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative">A</span>
            </span>
            <span className="text-base font-bold tracking-tighter sm:text-lg">
              <AuroraText>{SITE.name}</AuroraText>
            </span>
          </a>

          {/* Center nav (md+) — shared magnetic pill glides between items */}
          <NavigationMenu className="hidden lg:flex" aria-label="Navigation">
            <NavigationMenuList
              className="gap-0.5"
              onMouseLeave={() => setHovered(null)}
            >
              {PRIMARY_NAV.map((link) => {
                const isHot = highlighted === link.href;
                return (
                  <NavigationMenuItem
                    key={link.href}
                    onMouseEnter={() => setHovered(link.href)}
                  >
                    <NavigationMenuLink
                      href={link.href}
                      onFocus={() => setHovered(link.href)}
                      className={cn(
                        "relative rounded-full px-2.5 py-2 text-sm font-medium text-muted-foreground",
                        "transition-colors duration-300 hover:bg-transparent hover:text-foreground focus:bg-transparent",
                        isHot && "text-foreground",
                      )}
                    >
                      {isHot &&
                        (prefersReducedMotion ? (
                          <span className="absolute inset-0 rounded-full bg-white/75 ring-1 ring-white/60 shadow-[0_4px_16px_-6px_rgba(30,41,120,0.25)]" />
                        ) : (
                          <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-full bg-white/75 ring-1 ring-white/60 shadow-[0_4px_16px_-6px_rgba(30,41,120,0.25)]"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 32,
                              mass: 0.8,
                            }}
                          />
                        ))}
                      <span className="relative z-10">{link.label}</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right cluster */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Language dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden rounded-full text-muted-foreground transition-all duration-300 hover:bg-white/70 hover:text-foreground xl:inline-flex"
                    aria-label="Select language, current English"
                  />
                }
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>English</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 border-white/50 bg-white/70 backdrop-blur-xl"
              >
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem key={lang}>{lang}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Log in (ghost) */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-full font-medium text-muted-foreground transition-all duration-300 hover:bg-white/70 hover:text-foreground sm:inline-flex"
              render={<a href="/login" />}
              nativeButton={false}
            >
              Log in
            </Button>

            {/* Get started (primary) — Magic UI ShimmerButton wrapped in an
                accessible link (link owns focus + name; shimmer is decorative). */}
            <a
              href="/signup"
              aria-label="Deploy your fleet"
              className="group/cta relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ShimmerButton
                tabIndex={-1}
                aria-hidden="true"
                background={BRAND_GRADIENT}
                shimmerColor="#ffffff"
                shimmerDuration="2.6s"
                borderRadius="9999px"
                className="h-11 min-h-11 px-4 py-0 text-sm font-semibold shadow-sm shadow-brand/25 ring-1 ring-white/25 transition-transform duration-300 group-hover/cta:-translate-y-0.5 sm:h-9 sm:min-h-0 sm:px-3.5"
              >
                Deploy your fleet
              </ShimmerButton>
            </a>

            {/* Mobile menu (Sheet) */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="min-h-11 min-w-11 rounded-full text-foreground transition-all duration-300 hover:bg-white/70 lg:hidden"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full gap-0 border-white/40 bg-white/70 backdrop-blur-xl sm:max-w-sm"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-bold text-white shadow-sm shadow-brand/20 ring-1 ring-white/40"
                    >
                      A
                    </span>
                    <span className="text-lg font-bold tracking-tighter">
                      <AuroraText>{SITE.name}</AuroraText>
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-1 gap-1.5 border border-white/50 bg-white/60 text-[10px] font-semibold tracking-wide text-brand uppercase"
                    >
                      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                      </span>
                      Live
                    </Badge>
                  </SheetTitle>
                  <SheetDescription>Mobile navigation</SheetDescription>
                </SheetHeader>

                <AnimatePresence>
                  <motion.nav
                    aria-label="Mobile navigation"
                    className="flex flex-col gap-1 px-4"
                    variants={mobileList}
                    initial={prefersReducedMotion ? false : "hidden"}
                    animate="show"
                  >
                    {PRIMARY_NAV.map((link) => (
                      <motion.div
                        key={link.href}
                        variants={prefersReducedMotion ? undefined : mobileItem}
                      >
                        <SheetClose
                          render={
                            <a
                              href={link.href}
                              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-medium text-foreground transition-all duration-300 hover:bg-white/60 hover:backdrop-blur-md"
                            />
                          }
                        >
                          {link.label}
                        </SheetClose>
                      </motion.div>
                    ))}
                  </motion.nav>
                </AnimatePresence>

                <Separator className="my-4 bg-white/50" />

                <motion.div
                  className="flex flex-col gap-2 px-4 pb-4"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, y: 12 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.4,
                          ease: EASE,
                          delay: 0.08 + 0.06 * PRIMARY_NAV.length,
                        }
                  }
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 w-full rounded-full border-white/50 bg-white/60 font-medium backdrop-blur-md transition-all duration-300 hover:bg-white/70"
                    render={
                      <a href="/login" onClick={() => setMenuOpen(false)} />
                    }
                    nativeButton={false}
                  >
                    Log in
                  </Button>
                  <a
                    href="/signup"
                    aria-label="Deploy your fleet"
                    onClick={() => setMenuOpen(false)}
                    className="group/cta relative inline-flex w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ShimmerButton
                      tabIndex={-1}
                      aria-hidden="true"
                      background={BRAND_GRADIENT}
                      shimmerColor="#ffffff"
                      shimmerDuration="2.6s"
                      borderRadius="9999px"
                      className="h-11 w-full px-4 py-0 text-sm font-semibold shadow-sm shadow-brand/25 ring-1 ring-white/25"
                    >
                      Deploy your fleet
                    </ShimmerButton>
                  </a>
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
