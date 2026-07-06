"use client";

import { ReactLenis } from "lenis/react";

/**
 * Site-wide smooth scrolling (Lenis). `root` binds it to the window, and
 * `anchors` makes in-page #hash links glide smoothly. Respects the OS
 * reduced-motion preference automatically via Lenis.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        // Buttery "ultra-smooth" feel: expo-out easing over a slightly longer
        // duration, momentum on wheel + touch. transform-based → GPU-friendly.
        duration: 1.35,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        syncTouch: true,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
