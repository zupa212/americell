import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonLinkVariant = "primary" | "secondary" | "brand";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonLinkVariant;
  className?: string;
};

const base =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition hover:opacity-90";

const variants: Record<ButtonLinkVariant, string> = {
  primary: "bg-ink text-white",
  secondary: "border border-line bg-surface text-ink",
  brand: "bg-brand text-white",
};

/**
 * Styled pill link. Uses Next's Link for internal routes and a plain
 * anchor for external/hash targets to avoid client-side navigation
 * where it isn't wanted.
 */
export default function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: ButtonLinkProps) {
  const classes = cn(base, variants[variant], className);
  const isInternal = href.startsWith("/") && !href.startsWith("//");

  if (isInternal) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}
