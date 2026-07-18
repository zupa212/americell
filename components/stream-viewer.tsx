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
 * Live device stream, embedded in a 9:16 BLACK frame inside Americell chrome
 * (white-label — the same-origin `/api/rentals/[id]/stream` redirect resolves the
 * upstream, so the provider's domain never appears in our src or page source).
 *
 * The upstream session token is short-lived (~4h). When it lapses the upstream
 * frame shows "stream access expired — re-enter your PIN"; the customer taps
 * Reload and types the PIN (shown here) inside the frame to re-mint a fresh
 * session. `referrerPolicy` is intentionally NOT no-referrer, so the upstream can
 * load its own player assets.
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
      el.requestFullscreen().catch(() => toast.error("Couldn't enter fullscreen."));
    }
  }

  function reloadStream() {
    setReloadKey((k) => k + 1);
  }

  async function revealPin() {
    if (pin) return;
    setPinLoading(true);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/pin`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        pin?: string;
        error?: string;
      };
      if (res.ok && data.pin) setPin(data.pin);
      else toast.error(data.error ?? "Couldn't retrieve the PIN.");
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
    <div className="flex flex-col gap-3">
      {/* Control bar (dark) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
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
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-amber-500/15 text-amber-300",
          )}
        >
          {tokenFresh ? (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {tokenFresh ? "Live link" : "Tap Reload + enter PIN"}
        </span>

        <span className="text-xs text-white/50">Expires in {countdown}</span>

        <div className="flex w-full items-center gap-1.5 sm:ml-auto sm:w-auto">
          {pin ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyPin}
              className="h-11 flex-1 gap-1.5 rounded-full border-white/15 bg-white/10 font-mono tracking-[0.2em] text-white hover:bg-white/20 sm:h-8 sm:flex-initial"
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
              className="h-11 flex-1 gap-1.5 rounded-full border-white/15 bg-white/10 text-white hover:bg-white/20 sm:h-8 sm:flex-initial"
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
            className="h-11 flex-1 gap-1.5 rounded-full border-white/15 bg-white/10 text-white hover:bg-white/20 sm:h-8 sm:flex-initial"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reload</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={fullscreen}
            className="h-11 flex-1 gap-1.5 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft text-white sm:h-8 sm:flex-initial"
          >
            <Maximize className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
        </div>
      </div>

      {/* The stream — 9:16 PORTRAIT, black, with our logo watermark. */}
      <div className="flex justify-center">
        <div className="relative aspect-[9/16] h-[80dvh] max-h-[900px] w-auto max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_20px_70px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          <iframe
            key={reloadKey}
            ref={frameRef}
            src={streamSrc}
            title={`Americell — remote control ${model}`}
            className="absolute inset-0 h-full w-full border-0 bg-black"
            allow="autoplay; fullscreen; clipboard-read; clipboard-write; accelerometer; gyroscope"
          />
          {/* Americell logo watermark — never intercepts device taps. */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/americell-mark.png"
              alt="Americell"
              width={464}
              height={260}
              className="h-4 w-auto"
            />
            <span className="text-xs font-semibold text-white">Americell</span>
          </div>
        </div>
      </div>

      {/* Fallbacks. */}
      <p className="text-center text-xs text-white/50">
        Says “stream access expired”? Tap <span className="text-white/80">Reload</span> and enter your PIN.{" "}
        Still nothing?{" "}
        <a
          href={streamSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-brand-soft hover:text-white"
        >
          Open in a new tab
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
