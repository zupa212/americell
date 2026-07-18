"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Radio,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function formatRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Americell-branded LAUNCHER for the live device.
 *
 * The upstream video plays best as a TOP-LEVEL tab: the provider serves the real
 * player (jsmpeg + a WebSocket video feed) from a nested frame, and that deep
 * cross-origin nesting breaks the player when embedded in our own <iframe>. So we
 * present our own branded card and open the live stream in a NEW WINDOW from here.
 *
 * The stream URL is same-origin (`/api/rentals/[id]/stream`, a server redirect
 * resolves the upstream), so the provider's domain never appears in our src, our
 * links, or the page source (white-label).
 */
export default function StreamViewer({
  rentalId,
  model,
  platform,
  expiresAt,
  streamMintedAt,
}: {
  rentalId: string;
  model: string;
  platform: string;
  expiresAt: string | null;
  streamMintedAt: string | null;
}) {
  // Same-origin URL: a server-side redirect resolves the upstream stream, so the
  // provider's domain never appears in the link or the page source.
  const streamSrc = `/api/rentals/${rentalId}/stream`;
  const [pin, setPin] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const expiresMs = expiresAt ? Date.parse(expiresAt) : null;
  const mintedMs = streamMintedAt ? Date.parse(streamMintedAt) : null;
  const countdown =
    nowMs == null || expiresMs == null ? "—" : formatRemaining(expiresMs - nowMs);
  const tokenFresh =
    nowMs != null && mintedMs != null && nowMs - mintedMs < FOUR_HOURS_MS;

  async function revealPin() {
    if (pin) return;
    setPinLoading(true);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/pin`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        pin?: string;
        error?: string;
      };
      if (res.ok && data.pin) {
        setPin(data.pin);
      } else {
        toast.error(data.error ?? "Couldn't retrieve the PIN.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPinLoading(false);
    }
  }

  async function copyPin() {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      toast.success("PIN copied.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy.");
    }
  }

  const platformLabel = platform === "iphone" ? "iPhone" : "Android";

  return (
    <div className="flex flex-col gap-4">
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/50 bg-white/55 px-3 py-2 backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live · {platformLabel} {model}
        </span>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            tokenFresh
              ? "bg-emerald-50/70 text-emerald-700"
              : "bg-amber-50/70 text-amber-700",
          )}
        >
          {tokenFresh ? (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {tokenFresh ? "Live link" : "Enter the PIN on the device"}
        </span>

        <span className="text-xs text-muted-foreground">Expires in {countdown}</span>

        <div className="flex w-full items-center gap-1.5 sm:ml-auto sm:w-auto">
          {pin ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyPin}
              className="h-11 flex-1 gap-1.5 rounded-full border-white/50 bg-white/60 font-mono tracking-[0.2em] backdrop-blur-md sm:h-7 sm:flex-initial"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {pin}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={revealPin}
              disabled={pinLoading}
              className="h-11 flex-1 gap-1.5 rounded-full border-white/50 bg-white/60 backdrop-blur-md sm:h-7 sm:flex-initial"
            >
              {pinLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              PIN
            </Button>
          )}
        </div>
      </div>

      {/* Branded launcher — 9:16 portrait, our logo. Opens the live device in a
          new window (the reliable path; the upstream player breaks when embedded
          in a nested cross-origin iframe). */}
      <div className="flex justify-center">
        <div className="relative flex aspect-[9/16] h-[72dvh] max-h-[820px] w-auto max-w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-b from-white/75 to-white/45 px-6 text-center shadow-[0_20px_70px_-24px_rgba(30,41,120,0.45)] ring-1 ring-white/30 backdrop-blur-xl">
          {/* soft brand glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
          />
          {/* our logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/americell-mark.png"
            alt="Americell"
            width={464}
            height={260}
            className="relative h-14 w-auto"
          />
          <div className="relative">
            <p className="text-xl font-bold text-foreground">
              {platformLabel} {model}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live · ready to control
            </p>
          </div>
          <a
            href={streamSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-7 text-sm font-semibold text-white shadow-glow ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Radio className="h-4 w-4" aria-hidden="true" />
            Open live control
            <ExternalLink
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <p className="relative max-w-[30ch] text-xs leading-relaxed text-muted-foreground">
            Opens in a new window for the smoothest live control. If it asks for a
            code, use your PIN above.
          </p>
        </div>
      </div>
    </div>
  );
}
