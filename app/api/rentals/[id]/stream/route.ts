import { auth } from "@/auth";
import { getRentalForUser } from "@/lib/rentals";

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

  return new Response(null, {
    status: 302,
    headers: {
      Location: rental.streamUrl,
      // Don't leak our page URL to the upstream, and never cache the token URL.
      "Referrer-Policy": "no-referrer",
      ...NO_STORE,
    },
  });
}
