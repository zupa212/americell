"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

import { cn } from "@/lib/utils";

type LottieJson = { layers?: unknown[] } & Record<string, unknown>;

/**
 * Robust Lottie player. Pass `animationData` (imported JSON) or `src` (a public
 * path like "/lottie/pulse.json"). If the data is missing or malformed it
 * degrades to a soft brand pulse instead of crashing — so a bad/empty animation
 * never breaks the page.
 */
export default function LottiePlayer({
  animationData,
  src,
  loop = true,
  autoplay = true,
  className,
}: {
  animationData?: LottieJson;
  src?: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}) {
  const [data, setData] = useState<LottieJson | null>(animationData ?? null);

  useEffect(() => {
    if (animationData || !src) return;
    let active = true;
    fetch(src)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j) setData(j as LottieJson);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [animationData, src]);

  if (!data || !Array.isArray(data.layers)) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "animate-glow rounded-full bg-gradient-to-br from-brand via-brand-2 to-brand-soft opacity-60 blur-[2px]",
          className,
        )}
      />
    );
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
}
