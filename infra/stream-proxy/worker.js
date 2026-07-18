/**
 * Americell stream proxy — Cloudflare Worker.
 *
 * Makes the third-party CellGods live-phone stream play as a FIRST-PARTY,
 * built-in preview embedded inside https://www.ameri-cell.com. Vercel cannot
 * proxy WebSockets; Cloudflare Workers can — so this Worker runs on a first-party
 * subdomain (stream.ameri-cell.com) and reverse-proxies BOTH the stream HTML/
 * assets AND the live WebSocket to the upstream, rewriting every upstream URL to
 * itself so the browser only ever talks to *.ameri-cell.com.
 *
 * Two upstreams, routed by path:
 *   stream.ameri-cell.com/wl/...        -> https://devicecontrol.app/wl/...       (white-label shell)
 *   stream.ameri-cell.com/assets/...    -> https://devicecontrol.app/assets/...   (shell JS/CSS)
 *   stream.ameri-cell.com/_ip/<path>    -> https://iphone.devicecontrol.app/<path> (phone.html, jsmpeg, WS)
 *
 * Everything else defaults to the white-label shell origin.
 *
 * WHITE-LABEL + first-party wins: framing headers are stripped, and inside HTML/
 * JS bodies the absolute upstream URLs (https:// and wss://) are rewritten to
 * this Worker, so the video WebSocket becomes wss://stream.ameri-cell.com/_ip/…
 * (same-origin as the framed doc) and the Worker forges the upstream Origin so
 * the upstream's origin check passes.
 *
 * ⚠️ This proxies + lightly rewrites a third-party app. It is inherently brittle
 * (upstream markup/domain changes can break it) and may touch the provider's ToS
 * — prefer a provider-supplied embed URL when available. See README.md.
 */

const SHELL_ORIGIN = "https://devicecontrol.app";
const PHONE_ORIGIN = "https://iphone.devicecontrol.app";
const PHONE_HOST = "iphone.devicecontrol.app";
const SHELL_HOST = "devicecontrol.app";

/** Headers that would block framing / break first-party embedding — dropped. */
const STRIP_RESPONSE_HEADERS = [
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
];

/** Resolve the request path to an upstream absolute URL. */
function upstreamFor(url) {
  const p = url.pathname;
  if (p === "/_ip" || p.startsWith("/_ip/")) {
    const rest = p.slice("/_ip".length) || "/";
    return PHONE_ORIGIN + rest + url.search;
  }
  return SHELL_ORIGIN + p + url.search;
}

/** Rewrite absolute upstream URLs inside a text body to point back at us. */
function rewriteBody(text, selfOrigin, selfHost) {
  return text
    // phone origin (http + ws) -> our /_ip prefix
    .replaceAll(`${PHONE_ORIGIN}/`, `${selfOrigin}/_ip/`)
    .replaceAll(`${PHONE_ORIGIN}"`, `${selfOrigin}/_ip/"`)
    .replaceAll(`wss://${PHONE_HOST}/`, `wss://${selfHost}/_ip/`)
    .replaceAll(`ws://${PHONE_HOST}/`, `wss://${selfHost}/_ip/`)
    .replaceAll(`//${PHONE_HOST}/`, `//${selfHost}/_ip/`)
    // shell origin (absolute self-refs) -> our root
    .replaceAll(`${SHELL_ORIGIN}/`, `${selfOrigin}/`)
    .replaceAll(`wss://${SHELL_HOST}/`, `wss://${selfHost}/`)
    .replaceAll(`//${SHELL_HOST}/`, `//${selfHost}/`);
}

/** Copy upstream response headers, dropping framing/isolation blockers. */
function passHeaders(upstreamHeaders) {
  const h = new Headers(upstreamHeaders);
  for (const name of STRIP_RESPONSE_HEADERS) h.delete(name);
  // Allow this Worker's own subdomain to frame it (belt + suspenders).
  h.set("Access-Control-Allow-Origin", "*");
  return h;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const selfOrigin = `${url.protocol}//${url.host}`;
    const selfHost = url.host;
    const target = upstreamFor(url);

    // ── WebSocket upgrade → proxy the live video/control socket ──────────────
    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      const wsUrl = target.replace(/^http/, "ws"); // http(s)->ws(s)
      const outHeaders = new Headers(request.headers);
      // Forge the upstream Origin so its Origin check passes.
      outHeaders.set("Origin", PHONE_ORIGIN);
      outHeaders.set("Host", PHONE_HOST);
      const upstream = await fetch(wsUrl, { headers: outHeaders });
      const server = upstream.webSocket;
      if (!server) {
        return new Response("Upstream did not accept the WebSocket", { status: 502 });
      }
      server.accept();
      const [client, edge] = Object.values(new WebSocketPair());
      edge.accept();
      // Pipe both directions.
      const pipe = (from, to) => {
        from.addEventListener("message", (e) => {
          try { to.send(e.data); } catch {}
        });
        from.addEventListener("close", (e) => {
          try { to.close(e.code, e.reason); } catch {}
        });
        from.addEventListener("error", () => {
          try { to.close(); } catch {}
        });
      };
      pipe(server, edge);
      pipe(edge, server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // ── HTTP → proxy, forging upstream Origin/Referer, stripping framing ─────
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("Origin", target.startsWith(PHONE_ORIGIN) ? PHONE_ORIGIN : SHELL_ORIGIN);
    reqHeaders.set("Referer", target.startsWith(PHONE_ORIGIN) ? `${PHONE_ORIGIN}/` : `${SHELL_ORIGIN}/`);
    reqHeaders.delete("host");

    const upstream = await fetch(target, {
      method: request.method,
      headers: reqHeaders,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const ct = upstream.headers.get("content-type") || "";
    const headers = passHeaders(upstream.headers);

    // Follow upstream redirects, but keep them on our domain.
    const loc = upstream.headers.get("location");
    if (loc) {
      const abs = new URL(loc, target);
      let mapped = loc;
      if (abs.origin === PHONE_ORIGIN) mapped = `${selfOrigin}/_ip${abs.pathname}${abs.search}`;
      else if (abs.origin === SHELL_ORIGIN) mapped = `${selfOrigin}${abs.pathname}${abs.search}`;
      headers.set("location", mapped);
      return new Response(null, { status: upstream.status, headers });
    }

    // Rewrite text bodies (HTML / JS / CSS) so every upstream ref points at us.
    if (ct.includes("text/html") || ct.includes("javascript") || ct.includes("text/css") || ct.includes("json")) {
      const body = await upstream.text();
      const rewritten = rewriteBody(body, selfOrigin, selfHost);
      headers.delete("content-length");
      return new Response(rewritten, { status: upstream.status, headers });
    }

    // Binary (jsmpeg, images, video) — stream through untouched.
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
