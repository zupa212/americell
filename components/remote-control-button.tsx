"use client";

import Link from "next/link";
import { Radio } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "Άνοιξε τηλεχειρισμό" — navigates to the INTERNAL, Americell-branded control
 * page (`/dashboard/control/[id]`) that embeds the live device stream inside our
 * own chrome. We deliberately do NOT open the raw upstream stream URL in a new
 * tab, so the customer never sees the underlying provider's domain/branding
 * (white-label). The control page re-checks ownership server-side.
 */
export default function RemoteControlButton({
  rentalId,
  className,
  label = "Άνοιξε τηλεχειρισμό",
}: {
  rentalId: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={`/dashboard/control/${rentalId}`}
      className={cn(
        "group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full",
        "bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-sm font-semibold text-white",
        "border border-white/30 ring-1 ring-white/20 backdrop-blur-xl",
        "shadow-[0_10px_40px_-12px_rgba(43,107,255,0.45)]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.55)]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90"
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        <Radio className="h-4 w-4" aria-hidden />
        {label}
      </span>
    </Link>
  );
}
