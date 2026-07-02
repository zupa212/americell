import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
};

/** Semantic section landmark with the site's vertical rhythm. */
export function Section({ children, id, className }: SectionProps) {
  return (
    <section id={id} className={cn("py-24 sm:py-32", className)}>
      {children}
    </section>
  );
}
