# Americell stream proxy (Cloudflare Worker)

Makes the CellGods live-phone stream play as a **first-party, built-in preview**
embedded inside `ameri-cell.com`.

**Why a Worker:** Vercel cannot proxy WebSockets; the live video is a WebSocket,
so it must be proxied on a WebSocket-capable host. Cloudflare Workers can. This
Worker reverse-proxies the stream's HTML + assets **and** the live WebSocket, and
rewrites every upstream URL to itself, so the browser only ever talks to a
`*.ameri-cell.com` origin — the video socket becomes same-origin and the Worker
forges the upstream `Origin` so the upstream's origin check passes.

> ⚠️ **Caveats (read first).** This proxies **and lightly rewrites a third-party
> app**, so it is **brittle** — an upstream markup/domain change can break it —
> and may touch CellGods' Terms of Service. The durable fix is to ask CellGods
> for a no-popup embed URL (see the message in the chat). Also: their live
> **control** is a popup; a first-party proxy fixes the **video preview**, but
> truly in-page *control* may still need CellGods' cooperation. Test before
> relying on it.

## 1. Deploy (test URL first — no DNS changes)

```bash
cd infra/stream-proxy
npm i -g wrangler        # or: npx wrangler
wrangler login           # opens Cloudflare OAuth in your browser
wrangler deploy
```

You get: `https://americell-stream-proxy.<your-subdomain>.workers.dev`

## 2. Wire it into the app (env-gated — off until set)

On Vercel, set:

```
STREAM_PROXY_ORIGIN = https://americell-stream-proxy.<your-subdomain>.workers.dev
```

Redeploy. The app's stream route ([app/api/rentals/[id]/stream/route.ts](../../app/api/rentals/%5Bid%5D/stream/route.ts))
now rewrites the upstream `devicecontrol.app` origin to this proxy, so the
control-page iframe loads the stream **through the Worker, first-party**. Unset
the env to instantly revert to the direct (top-level) behaviour.

## 3. Test

Open a rental's remote control. In the browser Network tab you should see the
`phone.html`, `jsmpeg.min.js` and the **`wss://…workers.dev/_ip/…`** WebSocket all
loading from the Worker origin (not `devicecontrol.app`), and the video should
play **inside the frame**.

- ✅ Video plays embedded → success. Move to a first-party subdomain (step 4).
- ❌ Still stuck "Connecting…" → the upstream likely rejects even the forged
  origin, or the control needs their no-popup embed. Fall back to the branded
  new-tab launcher and send CellGods the embed request.

## 4. Production: first-party subdomain (after it works on workers.dev)

For same-site cookie/storage benefits and a clean URL:

1. Add `ameri-cell.com` as a Cloudflare zone (move nameservers to Cloudflare;
   re-create the existing Vercel DNS records — the app keeps running on Vercel).
2. Uncomment the `routes` block in [wrangler.toml](./wrangler.toml), `wrangler deploy`.
3. Set `STREAM_PROXY_ORIGIN = https://stream.ameri-cell.com` on Vercel.

## Rollback

Unset `STREAM_PROXY_ORIGIN` on Vercel → the app reverts to the direct top-level
stream immediately. No code change needed.
