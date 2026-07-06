"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";

/**
 * HeroPhoneParallax — tiny client child that gives the hero phone an
 * Apple-grade sense of depth without pulling the parent Hero out of the
 * Server Component world.
 *
 * Two independent transform layers compose cleanly (transform-only, GPU
 * friendly):
 *   • outer layer  → subtle scroll parallax (phone drifts up as the
 *     section passes through the viewport, so it moves relative to the
 *     floating app tiles that surround it)
 *   • inner layer  → a slow idle float/bob for life at rest
 *
 * The wrapper is `w-fit` so it stays shrink-to-fit and the absolutely
 * positioned tiles in the parent keep their anchoring. Honors
 * prefers-reduced-motion by rendering the phone perfectly still.
 */
export default function HeroPhoneParallax({
  children,
}: {
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Gentle scroll parallax — ~56px of travel across the full pass.
  const y = useTransform(scrollYProgress, [0, 1], [28, -28]);

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className="mx-auto w-fit">
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className="mx-auto w-fit [perspective:1200px]">
      <motion.div style={{ y, willChange: "transform" }}>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 7,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          style={{ willChange: "transform" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
