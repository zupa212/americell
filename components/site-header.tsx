"use client";

import { useEffect, useState } from "react";
import { Globe, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE } from "@/lib/site";
import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";
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
 * SiteHeader — a FLOATING, fully-rounded glassmorphism pill nav (Apple-style).
 *
 * The bar is a detached `rounded-full` frosted-glass pill that never touches the
 * top edge (a `pt-3/pt-4` gap keeps it floating over the global aurora). It stays
 * pinned while scrolling and tightens its shadow/opacity once the page moves.
 * Brand mark + AuroraText wordmark on the left; shadcn NavigationMenu in the
 * center (md+); language DropdownMenu + Log in + Get started (animated gradient)
 * on the right; a hamburger-triggered Sheet on mobile.
 */
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto w-full max-w-5xl px-4 pt-3 sm:pt-4">
        <div
          className={cn(
            "flex h-14 items-center justify-between gap-1.5 rounded-full border border-white/50 pl-4 pr-2 sm:gap-2 sm:pl-5",
            "bg-white/55 ring-1 ring-white/50 backdrop-blur-2xl backdrop-saturate-150",
            "transition-all duration-300",
            scrolled
              ? "bg-white/65 shadow-[0_16px_50px_-16px_rgba(30,41,120,0.38)]"
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

          {/* Center nav (md+) */}
          <NavigationMenu className="hidden md:flex" aria-label="Navigation">
            <NavigationMenuList className="gap-0.5">
              {NAV_LINKS.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink
                    href={link.href}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground",
                      "transition-all duration-300 hover:bg-white/70 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
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
                    className="hidden rounded-full text-muted-foreground transition-all duration-300 hover:bg-white/70 hover:text-foreground lg:inline-flex"
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

            {/* Get started (primary, animated gradient) */}
            <Button
              size="sm"
              className="min-h-11 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] px-4 font-semibold text-white shadow-sm shadow-brand/25 ring-1 ring-white/30 transition-all duration-300 animate-gradient hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_16px_40px_-16px_rgba(43,107,255,0.55)] sm:min-h-0 sm:px-2.5"
              render={<a href="/signup" />}
              nativeButton={false}
            >
              Get started
            </Button>

            {/* Mobile menu (Sheet) */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="min-h-11 min-w-11 rounded-full text-foreground transition-all duration-300 hover:bg-white/70 md:hidden"
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
                  </SheetTitle>
                  <SheetDescription>Mobile navigation</SheetDescription>
                </SheetHeader>

                <nav
                  aria-label="Mobile navigation"
                  className="flex flex-col gap-1 px-4"
                >
                  {NAV_LINKS.map((link) => (
                    <SheetClose
                      key={link.href}
                      render={
                        <a
                          href={link.href}
                          className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground transition-all duration-300 hover:bg-white/60 hover:backdrop-blur-md"
                        >
                          {link.label}
                        </a>
                      }
                    />
                  ))}
                </nav>

                <Separator className="my-4 bg-white/50" />

                <div className="flex flex-col gap-2 px-4 pb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 w-full rounded-full border-white/50 bg-white/60 font-medium backdrop-blur-md transition-all duration-300 hover:bg-white/70"
                    render={<a href="/login" onClick={() => setMenuOpen(false)} />}
                    nativeButton={false}
                  >
                    Log in
                  </Button>
                  <Button
                    size="lg"
                    className="h-11 w-full rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-[length:200%_auto] font-semibold text-white shadow-sm shadow-brand/25 ring-1 ring-white/30 transition-all duration-300 animate-gradient hover:opacity-95 hover:shadow-[0_16px_40px_-16px_rgba(43,107,255,0.55)]"
                    render={
                      <a href="/signup" onClick={() => setMenuOpen(false)} />
                    }
                    nativeButton={false}
                  >
                    Get started
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

const LANGUAGES = ["English"] as const;
