import type { NextRequest } from "next/server";

/**
 * First-party stream proxy (Vercel-only, no extra infra).
 *
 * Serves the upstream CellGods stream HTML + assets THROUGH our own origin
 * (ameri-cell.com/embed/…), rewriting the upstream absolute URLs to point back
 * here and stripping the framing headers — so the stream document is genuinely
 * FIRST-PARTY and plays EMBEDDED inside our page (with our logo around it),
 * instead of on devicecontrol.app.
 *
 * The live video WebSocket is intentionally LEFT pointing straight at the
 * upstream (Vercel can't proxy WebSockets). Because the framed document is now
 * first-party, the socket connects fine UNLESS the upstream validates the
 * WebSocket Origin header — in which case we fall back to the Cloudflare Worker
 * (infra/stream-proxy) which also proxies + re-origins the socket, or the
 * top-level "Open full-screen" launcher.
 *
 * Routing: /embed/_ip/<path> → https://iphone.devicecontrol.app/<path>
 *          /embed/<path>      → https://devicecontrol.app/<path>
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHELL = "https://devicecontrol.app";
const PHONE = "https://iphone.devicecontrol.app";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  const search = new URL(req.url).search;

  const isPhone = path[0] === "_ip";
  const rel = (isPhone ? path.slice(1) : path).join("/");
  const base = isPhone ? PHONE : SHELL;
  const upstream = `${base}/${rel}${search}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: {
        "user-agent": req.headers.get("user-agent") ?? "Mozilla/5.0",
        accept: req.headers.get("accept") ?? "*/*",
        "accept-language": req.headers.get("accept-language") ?? "en-US,en;q=0.9",
        // Forge the upstream origin/referer so their referer/hotlink checks pass.
        origin: base,
        referer: `${base}/`,
      },
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unreachable", { status: 502 });
  }

  const ct = res.headers.get("content-type") ?? "application/octet-stream";
  const headers = new Headers({ "content-type": ct, "cache-control": "no-store" });
  // Framing/isolation headers intentionally NOT copied → we control framing.

  // Rewrite absolute upstream URLs (http only) inside text bodies so every asset
  // + the nested phone.html load first-party. wss:// is left direct on purpose.
  if (/text\/html|javascript|text\/css|application\/json/i.test(ct)) {
    let body = await res.text();
    body = body
      .split(`${PHONE}/`).join("/embed/_ip/")
      .split(PHONE).join("/embed/_ip")
      .split(`${SHELL}/`).join("/embed/")
      .split(SHELL).join("/embed");
    return new Response(body, { status: res.status, headers });
  }

  return new Response(res.body, { status: res.status, headers });
}
