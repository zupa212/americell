"use client";

import { useState } from "react";
import { Globe, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE } from "@/lib/site";
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
 * SiteHeader — sticky, frosted-glass top navigation for the Americell site.
 *
 * The bar floats over the global aurora background as a frosted glass panel
 * (bg-white/60 + backdrop-blur-xl + a soft white hairline border). Left:
 * gradient brand mark + wordmark. Center (md+): shadcn NavigationMenu with the
 * primary nav anchors, each with a smooth hover. Right: a language
 * DropdownMenu, a "Σύνδεση" outline Button, and a "Ξεκίνα τώρα" primary Button.
 * On mobile the links collapse into a hamburger-triggered shadcn Sheet.
 */
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/60 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <a
          href="#top"
          className="group flex items-center gap-2.5 rounded-lg outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`${SITE.name} — Αρχική`}
        >
          <span
            aria-hidden="true"
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-bold text-white shadow-sm shadow-brand/20 ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">A</span>
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            {SITE.name}
          </span>
        </a>

        {/* Center nav (md+) */}
        <NavigationMenu className="hidden md:flex" aria-label="Πλοήγηση">
          <NavigationMenuList className="gap-1">
            {NAV_LINKS.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-2 font-medium text-muted-foreground",
                    "transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:backdrop-blur-md",
                  )}
                >
                  {NAV_LABELS_EL[link.href] ?? link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Language dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="lg"
                  className="hidden text-muted-foreground transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:backdrop-blur-md sm:inline-flex"
                  aria-label="Επιλογή γλώσσας, τρέχουσα Ελληνικά"
                />
              }
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>Ελληνικά</span>
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

          {/* Log in (outline) */}
          <Button
            variant="outline"
            size="lg"
            className="hidden border-white/50 bg-white/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 sm:inline-flex"
            render={<a href="/login" />}
            nativeButton={false}
          >
            Σύνδεση
          </Button>

          {/* Get started (primary) */}
          <Button
            size="lg"
            className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_16px_40px_-16px_rgba(43,107,255,0.55)]"
            render={<a href="/signup" />}
            nativeButton={false}
          >
            Ξεκίνα τώρα
          </Button>

          {/* Mobile menu (Sheet) */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="border-white/50 bg-white/60 backdrop-blur-md transition-all duration-300 hover:bg-white/70 md:hidden"
                  aria-label="Άνοιγμα μενού"
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
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    {SITE.name}
                  </span>
                </SheetTitle>
                <SheetDescription>Πλοήγηση για κινητά</SheetDescription>
              </SheetHeader>

              <nav
                aria-label="Πλοήγηση για κινητά"
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
                        {NAV_LABELS_EL[link.href] ?? link.label}
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
                  className="h-11 w-full border-white/50 bg-white/60 backdrop-blur-md transition-all duration-300 hover:bg-white/70"
                  render={<a href="/login" onClick={() => setMenuOpen(false)} />}
                  nativeButton={false}
                >
                  Σύνδεση
                </Button>
                <Button
                  size="lg"
                  className="h-11 w-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 ring-1 ring-white/30 transition-all duration-300 hover:opacity-95 hover:shadow-[0_16px_40px_-16px_rgba(43,107,255,0.55)]"
                  render={
                    <a href="/signup" onClick={() => setMenuOpen(false)} />
                  }
                  nativeButton={false}
                >
                  Ξεκίνα τώρα
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/** Greek display labels for the primary nav, keyed by href. */
const NAV_LABELS_EL: Record<string, string> = {
  "#top": "Αρχική",
  "#how": "Πώς λειτουργεί",
  "#pricing": "Τιμές",
  "#clients": "Πελάτες",
};

const LANGUAGES = ["Ελληνικά"] as const;
