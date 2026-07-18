"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Maximize,
  RefreshCw,
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
 * Embeds the live device stream in an <iframe> inside Americell chrome
 * (white-label). The stream URL carries a 4h token; once it goes stale the
 * customer re-enters the PIN inside the frame to re-mint a fresh session. A
 * "new tab" affordance stays available as a fallback if the provider blocks
 * framing, but the default experience never leaves americell.*.
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
  // provider's domain never appears in the src, the link or the page source.
  const streamSrc = `/api/rentals/${rentalId}/stream`;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

  function fullscreen() {
    const el = frameRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        toast.error("Couldn't enter fullscreen.");
      });
    }
  }

  function reloadStream() {
    setReloadKey((k) => k + 1);
  }

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

  return (
    <div className="flex flex-col gap-4">
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/50 bg-white/55 px-3 py-2 backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live · {platform === "iphone" ? "iPhone" : "Android"} {model}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reloadStream}
            className="h-11 flex-1 gap-1.5 rounded-full border-white/50 bg-white/60 backdrop-blur-md sm:h-7 sm:flex-initial"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reload</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={fullscreen}
            className="h-11 flex-1 gap-1.5 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white sm:h-7 sm:flex-initial"
          >
            <Maximize className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
        </div>
      </div>

      {/* The stream itself — 9:16 PORTRAIT (like a real phone), centered and
          framed in Americell glass. No referrerPolicy override: the upstream page
          must keep a same-origin referer to load its own player (jsmpeg). */}
      <div className="flex justify-center">
        <div className="relative aspect-[9/16] h-[78dvh] max-h-[880px] w-auto max-w-full overflow-hidden rounded-[2rem] border border-white/50 bg-black shadow-[0_20px_70px_-24px_rgba(30,41,120,0.45)] ring-1 ring-white/30">
          <iframe
            key={reloadKey}
            ref={frameRef}
            src={streamSrc}
            title={`Americell — remote control ${model}`}
            className="absolute inset-0 h-full w-full border-0 bg-black"
            allow="autoplay; fullscreen; clipboard-read; clipboard-write; accelerometer; gyroscope"
          />
        </div>
      </div>

      {/* Fallback if the provider blocks embedding. */}
      <p className="text-center text-xs text-muted-foreground">
        Live view not loading?{" "}
        <a
          href={streamSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-2"
        >
          Open in a new tab
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
