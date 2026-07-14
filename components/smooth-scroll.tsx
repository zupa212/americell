"use client";

import { useEffect, useState } from "react";
import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";

/**
 * Site-wide smooth scrolling (Lenis). `root` binds it to the window, and
 * `anchors` makes in-page #hash links glide smoothly.
 *
 * Lenis is transform-based (GPU-friendly), but it does NOT read the OS
 * reduced-motion preference on its own and — most importantly for phones — its
 * `syncTouch` mode hijacks every touchmove in JS, which is the single biggest
 * source of mobile scroll jank. This component keeps the full desktop feel and
 * downgrades from it: native compositor touch-scroll on coarse pointers, and no
 * momentum smoothing at all when the user prefers reduced motion.
 */

// expo-out easing — the signature "ultra-smooth" desktop scroll curve. Shared
// by every profile so the feel stays identical across devices.
const easing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// Full desktop experience. Also the SSR / first-paint default, so the premium
// look is preserved with no hydration mismatch — effects only ever downgrade
// from here once the device is known on the client.
const DESKTOP_OPTIONS: LenisOptions = {
  // Buttery "ultra-smooth" feel: expo-out easing over a slightly longer
  // duration, momentum on wheel + touch. transform-based → GPU-friendly.
  duration: 1.35,
  easing,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  syncTouch: true,
  anchors: true,
};

// Coarse-pointer / <=640px phones: keep Lenis (and anchors) but turn OFF
// syncTouch so the compositor's native touch-scroll drives the page. Not
// intercepting every touchmove in JS is the largest mobile scroll-jank fix;
// wheel smoothing is retained but irrelevant on touch input.
const TOUCH_OPTIONS: LenisOptions = { ...DESKTOP_OPTIONS, syncTouch: false };

// Reduced motion: no momentum smoothing — native wheel/touch scroll and instant
// anchor jumps. globals.css already neutralizes CSS keyframes under this query,
// but Lenis is JS-driven and ignores that rule, so we honor it explicitly here.
const REDUCED_OPTIONS: LenisOptions = {
  ...DESKTOP_OPTIONS,
  smoothWheel: false,
  syncTouch: false,
  anchors: { immediate: true },
};

type ScrollProfile = "desktop" | "touch" | "reduced";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to the full desktop experience for SSR + first paint (no hydration
  // mismatch — `root` Lenis renders children directly, so options never touch
  // the DOM). The effect below resolves the real device profile on the client.
  const [profile, setProfile] = useState<ScrollProfile>("desktop");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse), (max-width: 640px)");

    const sync = () => {
      setProfile(
        reduce.matches ? "reduced" : coarse.matches ? "touch" : "desktop",
      );
    };

    sync();
    reduce.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
    };
  }, []);

  const options =
    profile === "reduced"
      ? REDUCED_OPTIONS
      : profile === "touch"
        ? TOUCH_OPTIONS
        : DESKTOP_OPTIONS;

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
