import { NextResponse, type NextRequest } from "next/server";

import { rateLimit } from "@/lib/rate-limit";

/**
 * Proxy (Next.js 16's renamed Middleware). Two jobs:
 *  1. Brute-force throttling per client IP on the auth callback and the public
 *     lead endpoint (blunts credential stuffing / form spam).
 *  2. Baseline security headers on every response (clickjacking, MIME sniffing,
 *     referrer leakage, feature access, HSTS).
 *
 * Per-account login throttling lives in auth.ts; this is the IP-level layer.
 * Both are best-effort in serverless (per-instance memory) — see lib/rate-limit.
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=63072000",
};

function clientIp(req: NextRequest): string {
  // On Vercel, x-real-ip is the platform-set true client IP (it overwrites any
  // client-supplied X-Forwarded-For rather than appending), so prefer it; fall
  // back to the LAST XFF hop (the trusted proxy-appended value), never the
  // spoofable leftmost token.
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return (parts[parts.length - 1] ?? "").trim() || "unknown";
  }
  return "unknown";
}

// path -> { limit, windowMs } for brute-force-prone POSTs.
const POST_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/callback/credentials": { limit: 12, windowMs: 10 * 60 * 1000 },
  "/api/leads": { limit: 6, windowMs: 60 * 1000 },
};

export function proxy(req: NextRequest) {
  // Normalise trailing slash so /api/leads/ can't skip the exact-match lookup.
  const pathname = req.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (req.method === "POST") {
    const rule = POST_LIMITS[pathname];
    if (rule) {
      const ip = clientIp(req);
      const { ok, retryAfter } = rateLimit(`${pathname}:${ip}`, rule.limit, rule.windowMs);
      if (!ok) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down and try again shortly." },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter || 60), ...SECURITY_HEADERS },
          },
        );
      }
    }
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)$).*)"],
};
