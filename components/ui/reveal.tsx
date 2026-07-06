"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Semantic element to render. Defaults to a div. */
  as?: "div" | "section" | "article" | "li" | "span";
};

/**
 * Buttery scroll-reveal wrapper: fades in while sliding up 18px -> 0, scaling
 * 0.98 -> 1, and dissolving a subtle blur (6px -> 0) over ~0.55s ease-out,
 * triggering once when it enters the viewport. Stagger sibling reveals via
 * `delay`. Honors prefers-reduced-motion by rendering fully static.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  const MotionTag = motion[as];

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={cn(className)}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
        delay,
        filter: { duration: 0.5, ease: "easeOut", delay },
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </MotionTag>
  );
}
