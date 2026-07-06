"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { AuroraText } from "@/components/ui/aurora-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon };

// Greek labels per §6.2/§6.4. Order = build order of the admin sections.
const LINKS: readonly NavLink[] = [
  { href: "/admin", label: "Επισκόπηση", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Απόθεμα", icon: Boxes },
  { href: "/admin/orders", label: "Παραγγελίες", icon: ReceiptText },
  { href: "/admin/billing", label: "Χρεώσεις", icon: Wallet },
];

/** Overview (`/admin`) matches exactly; sections match their prefix. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * AdminNav — sticky frosted-glass chrome for the owner cockpit (§6.4).
 *
 * AuroraText wordmark + "Owner" badge, the four Greek section links with an
 * active-state pill, and a sign-out button. Sign-out submits the `logout`
 * server action through a real <form>, so it works without JS. Client
 * component only for `usePathname` (active link) — the email string is passed
 * down from the server layout, never fetched here.
 */
export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/50 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-6 py-3">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 rounded-lg outline-none transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand-soft text-base font-bold text-white shadow-sm shadow-brand/20"
          >
            A
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            <AuroraText>Americell</AuroraText>
          </span>
          <Badge
            variant="secondary"
            className="ml-1 h-5 gap-1 border border-white/50 bg-white/60 px-2 text-[0.7rem] text-foreground backdrop-blur-md"
          >
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Owner
          </Badge>
        </Link>

        <nav
          aria-label="Διαχείριση"
          className="order-last w-full overflow-x-auto lg:order-none lg:mx-auto lg:w-auto"
        >
          <ul className="flex items-center gap-1">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      active
                        ? "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white shadow-sm shadow-brand/25"
                        : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="hidden max-w-[18ch] truncate text-xs text-muted-foreground sm:inline"
            title={email}
          >
            {email}
          </span>
          <form action={logout}>
            <Button
              variant="outline"
              size="lg"
              aria-label="Αποσύνδεση"
              className="gap-1.5 border-white/50 bg-white/60 backdrop-blur-md hover:bg-white/70"
              render={<button type="submit" />}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Αποσύνδεση</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
