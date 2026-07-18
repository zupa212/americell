import { auth } from "@/auth";
import { getRentalForUser } from "@/lib/rentals";
import { logEvent } from "@/lib/logs";

/**
 * GET /api/rentals/[id]/stream — ownership-checked, same-origin redirect to the
 * upstream device stream. WHITE-LABEL: the upstream (CellGods) URL is read
 * server-side and never handed to the client, so the iframe src, the customer's
 * "open in new tab" link, the page source and the RSC props are all americell.*
 * — the provider's domain never appears in anything the customer can see or copy.
 */
const ACTIVE = new Set(["active", "pooled"]);
const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login", ...NO_STORE },
    });
  }

  const { id } = await params;
  const rental = await getRentalForUser(id, session.user.id);
  if (!rental || !ACTIVE.has(rental.status) || !rental.streamUrl) {
    return new Response("Not available", { status: 404, headers: NO_STORE });
  }

  // Audit: the owner opened the live device stream (best-effort, never blocks).
  await logEvent({
    actorType: "customer",
    actorEmail: session.user.email,
    actorId: session.user.id,
    action: "device.stream_opened",
    targetType: "rental",
    targetId: rental.id,
    metadata: { model: rental.model },
  });

  // When a first-party stream proxy is configured (Cloudflare Worker — see
  // infra/stream-proxy), route the iframe THROUGH it so the stream HTML + the
  // live WebSocket load first-party and play EMBEDDED. Unset STREAM_PROXY_ORIGIN
  // to instantly revert to the direct (top-level) URL.
  const proxy = process.env.STREAM_PROXY_ORIGIN?.replace(/\/+$/, "");
  const location = proxy
    ? rental.streamUrl
        .replace("https://iphone.devicecontrol.app", `${proxy}/_ip`)
        .replace("https://devicecontrol.app", proxy)
    : rental.streamUrl;

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // strict-origin-when-cross-origin (NOT no-referrer): the upstream stream
      // page needs a referer to load its OWN player assets (jsmpeg.min.js) — with
      // no-referrer those subresource requests 403. This still only leaks our
      // ORIGIN (never the rental-id path or token) to the upstream.
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...NO_STORE,
    },
  });
}
