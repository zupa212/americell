"use client";

import { useEffect, useState, type MouseEvent } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Radio,
  ShieldCheck,
  Smartphone,
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
 * Live device launcher, in a BLACK Americell-branded 9:16 frame.
 *
 * The upstream live control is a Vite SPA that builds its video WebSocket from
 * `location.host` and only connects TOP-LEVEL, so we open the live phone in a
 * NEW WINDOW from our branded frame, where it connects and plays. The stream URL
 * is same-origin (`/api/rentals/[id]/stream`, a server redirect resolves the
 * upstream), so the provider's domain never appears in our links (white-label).
 *
 * A true in-page embed needs a first-party SUBDOMAIN proxy that also proxies the
 * WebSocket (infra/stream-proxy Cloudflare Worker), or a CellGods embed URL.
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
  const [pin, setPin] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [opening, setOpening] = useState(false);

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

  /**
   * Open the live phone. The upstream stream *session* expires ~hourly (black
   * screen / "Control: Connecting…") even while the rental is active, so we first
   * RE-GRAB a fresh link server-side (POST /refresh → re-`activate`, free on a
   * pool device), then point the tab at our same-origin /stream redirect, which
   * now serves the freshly-stored URL. The tab is opened synchronously up-front so
   * it isn't swallowed by a popup blocker after the await.
   */
  async function openLive(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (opening) return;
    const win = window.open("about:blank", "_blank");
    setOpening(true);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/refresh`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        // Non-fatal: fall back to the last stored link — better than nothing.
        toast.error(data.error ?? "Couldn't refresh the live link — opening the last one.");
      }
    } catch {
      toast.error("Network error — opening the last known link.");
    } finally {
      setOpening(false);
      if (win && !win.closed) {
        try {
          win.opener = null;
        } catch {
          /* cross-origin guard already severed it */
        }
        win.location.href = streamSrc;
      } else {
        // Popup was blocked despite the up-front open — retry within the gesture.
        window.open(streamSrc, "_blank", "noopener,noreferrer");
      }
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
          {tokenFresh ? "Live link" : "Idle — tap Open to reconnect"}
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
        </div>
      </div>

      {/* Black 9:16 Americell frame — opens the live phone in a new window. */}
      <div className="flex justify-center">
        <div className="relative flex aspect-[9/16] h-[80dvh] max-h-[900px] w-auto max-w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black px-6 text-center shadow-[0_20px_70px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/25 blur-3xl"
          />
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 backdrop-blur-md">
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

          <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Smartphone className="h-7 w-7 text-white/80" aria-hidden="true" />
          </span>
          <div className="relative">
            <p className="text-xl font-bold text-white">
              {platformLabel} {model}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {tokenFresh ? "Live · ready to control" : "Idle · tap Open to reconnect"}
            </p>
          </div>
          <a
            href={streamSrc}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openLive}
            aria-busy={opening}
            className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand-soft px-8 text-sm font-semibold text-white shadow-glow ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-0.5 aria-busy:opacity-80"
          >
            {opening ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Radio className="h-4 w-4" aria-hidden="true" />
            )}
            {opening ? "Reconnecting…" : "Open live phone"}
          </a>
          <p className="relative max-w-[32ch] text-xs leading-relaxed text-white/50">
            Refreshes the live link and opens full-screen in a new window. If it
            asks for a code, use your PIN above.
          </p>
        </div>
      </div>
    </div>
  );
}
