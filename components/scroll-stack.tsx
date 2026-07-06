"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * SCROLL-STACK — the "stacking cards" scroll effect.
 *
 * Each <ScrollStackItem> is wrapped in a `position: sticky` shell that pins near
 * the top of the viewport. Because the shells share a sticky `top`, later cards
 * slide up and cover earlier ones, while a small per-card vertical offset makes
 * the tops cascade into a neat staircase of peeks. As you scroll through the
 * stack, the container's `scrollYProgress` drives each card behind the front one
 * to gently scale down + fade — using ONLY `transform` and `opacity` so the whole
 * thing stays on the compositor (GPU-friendly, no layout thrash).
 *
 * Fully reduced-motion safe: when the user prefers reduced motion, the stack
 * degrades to a plain, statically-spaced vertical list.
 */

type StackConfig = {
  /** Sticky offset from the top of the viewport (clears a fixed header). */
  topOffset: string;
  /** Scroll travel reserved per card — controls how slow/fast the stack reveals. */
  itemTravel: string;
  /** Vertical px offset added per card index — the visible staircase peek. */
  stackGap: number;
  /** How much each card behind the front one shrinks, per step of depth. */
  scaleStep: number;
  /** Hard floor for the furthest-back card's scale. */
  minScale: number;
  /** How much each card behind the front one fades, per step of depth. */
  fadeStep: number;
};

type StackContextValue = {
  progress: MotionValue<number>;
  count: number;
  reduced: boolean;
  config: StackConfig;
};

const ScrollStackContext = createContext<StackContextValue | null>(null);

export interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  /** Sticky offset from the top of the viewport so pinned cards clear a fixed header. */
  topOffset?: string;
  /** Scroll travel reserved per card (pacing of the reveal). */
  itemTravel?: string;
  /** Vertical px offset added per stacked card — the staircase peek. */
  stackGap?: number;
  /** How much each card behind the front one shrinks, per step of depth. */
  scaleStep?: number;
  /** Hard floor for the scale of the furthest-back card. */
  minScale?: number;
  /** How much each card behind the front one fades, per step of depth. */
  fadeStep?: number;
}

export function ScrollStack({
  children,
  className,
  topOffset = "5.5rem",
  itemTravel = "82vh",
  stackGap = 22,
  scaleStep = 0.04,
  minScale = 0.86,
  fadeStep = 0.1,
}: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  // Track scroll across the entire stack: 0 when its top hits the top of the
  // viewport, 1 when its bottom hits the bottom. Passive by default in motion.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const items = Children.toArray(children).filter(
    isValidElement
  ) as ReactElement<ScrollStackItemProps>[];
  const count = items.length;

  const config: StackConfig = {
    topOffset,
    itemTravel,
    stackGap,
    scaleStep,
    minScale,
    fadeStep,
  };

  const rendered = items.map((child, i) =>
    cloneElement(child, { index: i, total: count, key: child.key ?? i })
  );

  return (
    <ScrollStackContext.Provider
      value={{ progress: scrollYProgress, count, reduced, config }}
    >
      <div
        ref={containerRef}
        className={cn(reduced ? "flex flex-col gap-6" : "relative", className)}
      >
        {rendered}
      </div>
    </ScrollStackContext.Provider>
  );
}

export interface ScrollStackItemProps {
  children: ReactNode;
  className?: string;
  /** Injected by <ScrollStack>. */
  index?: number;
  /** Injected by <ScrollStack>. */
  total?: number;
}

export function ScrollStackItem({
  children,
  className,
  index = 0,
  total = 1,
}: ScrollStackItemProps) {
  const ctx = useContext(ScrollStackContext);
  const ownReduced = useReducedMotion() ?? false;
  // Stable fallback so hook order never changes when used outside a <ScrollStack>.
  const fallback = useMotionValue(0);

  const progress = ctx?.progress ?? fallback;
  const reduced = ctx?.reduced ?? ownReduced;
  const count = ctx?.count ?? total;
  const cfg = ctx?.config;

  const scaleStep = cfg?.scaleStep ?? 0.04;
  const minScale = cfg?.minScale ?? 0.86;
  const fadeStep = cfg?.fadeStep ?? 0.1;

  const step = count > 1 ? 1 / count : 1;
  // The card's slice of scroll: from when it becomes the front card, to the end.
  const rangeStart = Math.min(index * step, 0.999);
  // Depth behind the front (last) card: 0 = front, larger = further back.
  const depth = Math.max(0, count - 1 - index);
  const targetScale = Math.max(minScale, 1 - depth * scaleStep);
  const targetOpacity = Math.max(0, 1 - depth * fadeStep);

  // useTransform clamps by default, so before a card is the front card its
  // scale/opacity stay pinned at 1 (no extrapolation past 1x).
  const scale = useTransform(progress, [rangeStart, 1], [1, targetScale]);
  const opacity = useTransform(progress, [rangeStart, 1], [1, targetOpacity]);

  if (reduced) {
    return <div className={cn(className)}>{children}</div>;
  }

  const topOffset = cfg?.topOffset ?? "5.5rem";
  const itemTravel = cfg?.itemTravel ?? "82vh";
  const stackGap = cfg?.stackGap ?? 22;

  return (
    <div
      className="sticky flex w-full items-start justify-center"
      style={{ top: topOffset, height: itemTravel }}
    >
      <motion.div
        className={cn("w-full will-change-transform", className)}
        style={{
          scale,
          opacity,
          // Static per-card offset via transform (GPU) — builds the staircase.
          y: index * stackGap,
          transformOrigin: "top center",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default ScrollStack;
