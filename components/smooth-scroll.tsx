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
      options={{ lerp: 0.1, duration: 1.15, smoothWheel: true, anchors: true }}
    >
      {children}
    </ReactLenis>
  );
}
