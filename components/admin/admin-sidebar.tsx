"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { AuroraText } from "@/components/ui/aurora-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LottiePlayer from "@/components/ui/lottie";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

// Labels per §6.2/§6.4. Order = build order of the admin sections.
const LINKS: readonly NavLink[] = [
  {
    href: "/admin",
    label: "Overview",
    description: "Dashboard & live metrics",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    description: "Devices & availability",
    icon: Boxes,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Purchases & fulfilment",
    icon: ReceiptText,
  },
  {
    href: "/admin/rentals",
    label: "Rentals",
    description: "Active device sessions",
    icon: Smartphone,
  },
  {
    href: "/admin/customers",
    label: "Customers",
    description: "Accounts & balances",
    icon: Users,
  },
  {
    href: "/admin/billing",
    label: "Billing",
    description: "Ledger & top-ups",
    icon: Wallet,
  },
  {
    href: "/admin/logs",
    label: "Logs",
    description: "Audit trail",
    icon: ScrollText,
  },
];

/** Overview (`/admin`) matches exactly; sections match their prefix. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The section the current path belongs to — most specific (longest) match wins. */
export function currentSection(pathname: string): NavLink {
  const match = [...LINKS]
    .filter((link) => isActive(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ?? LINKS[0];
}

/** Americell wordmark + "Owner" badge — the identity block at the top of the shell. */
function Brand() {
  return (
    <Link
      href="/admin"
      className="group flex items-center gap-2.5 rounded-2xl px-1 outline-none transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/americell-mark.png"
        alt=""
        aria-hidden="true"
        width={464}
        height={260}
        className="h-8 w-auto shrink-0"
      />
      <span className="text-lg font-bold tracking-tight text-foreground">
        <AuroraText>Americell</AuroraText>
      </span>
      <Badge
        variant="secondary"
        className="ml-0.5 h-5 gap-1 border border-white/50 bg-white/60 px-2 text-[0.7rem] text-foreground backdrop-blur-md"
      >
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        Owner
      </Badge>
    </Link>
  );
}

/**
 * Shared inner body of the shell — brand, live indicator, section links with an
 * active-state pill, and the pinned sign-out. Rendered both in the fixed desktop
 * sidebar and inside the mobile Sheet. `onNavigate` lets the Sheet close itself
 * when a link is tapped. Sign-out submits the `logout` server action through a
 * real <form>, so it works without JS.
 */
function ShellBody({
  email,
  onNavigate,
}: {
  email: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-4">
      <Brand />

      {/* Live heartbeat — Lottie pulse degrades to a soft glow if absent. */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-xs text-muted-foreground ring-1 ring-white/40 backdrop-blur-md">
        <LottiePlayer src="/lottie/pulse.json" className="h-5 w-5" />
        <span className="font-medium text-foreground">System online</span>
        <span className="relative ml-auto flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </div>

      <Separator className="bg-white/50" />

      <nav aria-label="Admin sections" className="-mx-1 flex-1 overflow-y-auto px-1">
        <ul className="flex flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    active
                      ? "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25 ring-1 ring-white/30"
                      : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110",
                      active ? "text-white" : "text-brand",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator className="bg-white/50" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/50 bg-white/50 px-3 py-2 ring-1 ring-white/40 backdrop-blur-md">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-xs font-semibold text-white ring-1 ring-white/40"
          >
            {email.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-xs font-medium text-foreground"
              title={email}
            >
              {email}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">Owner account</p>
          </div>
        </div>

        <form action={logout}>
          <Button
            variant="outline"
            size="lg"
            aria-label="Sign out"
            className="w-full justify-start gap-2 border-white/50 bg-white/60 backdrop-blur-md hover:bg-white/70"
            render={<button type="submit" />}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * AdminSidebar — fixed, full-height frosted-glass cockpit rail (§6.4).
 *
 * Floats on the global aurora as a rounded glass panel down the left edge on
 * md+. Below md it is hidden; navigation there lives in {@link AdminTopbar}'s
 * Sheet. Client component only for `usePathname` (active link) — `email` is
 * passed down from the server layout, never fetched here.
 */
export default function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 p-3 md:flex">
      <div className="flex flex-1 flex-col rounded-3xl border border-white/50 bg-white/60 p-4 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-xl">
        <ShellBody email={email} />
      </div>
    </aside>
  );
}

/**
 * AdminTopbar — slim glass topbar for the content column.
 *
 * Holds the mobile menu trigger (a Sheet mirroring the sidebar, < md), the live
 * page context derived from the path, and the signed-in owner's email. Sticky so
 * it stays put while the wide main area scrolls beneath it.
 */
export function AdminTopbar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const section = currentSection(pathname);
  const SectionIcon = section.icon;

  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/60 px-3 py-2.5 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)] ring-1 ring-white/40 backdrop-blur-xl md:px-4">
        {/* Mobile menu — collapses the sidebar into a Sheet (< md only). */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-foreground hover:bg-white/70 md:hidden"
                aria-label="Open admin menu"
              />
            }
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="gap-0 border-white/40 bg-white/70 p-4 backdrop-blur-xl data-[side=left]:w-80 data-[side=left]:sm:max-w-80"
          >
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Owner cockpit sections
            </SheetDescription>
            <ShellBody email={email} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Page context — which section the owner is looking at. */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="hidden h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/15 text-brand ring-1 ring-white/50 sm:grid"
          >
            <SectionIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {section.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {section.description}
            </p>
          </div>
        </div>

        {/* Signed-in owner. */}
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden h-6 gap-1 border border-white/50 bg-white/60 px-2 text-[0.7rem] text-foreground backdrop-blur-md sm:inline-flex"
          >
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Owner
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="hidden max-w-[22ch] cursor-default truncate rounded-full border border-white/50 bg-white/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md sm:inline-block" />
                }
              >
                {email}
              </TooltipTrigger>
              <TooltipContent>Signed in as {email}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
