import { auth } from "@/auth";
import { deviceById } from "@/lib/devices";
import { getActiveSubscription } from "@/lib/subscriptions";
import { requestUnlockSession } from "@/lib/provider";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!deviceById(id)) {
    return Response.json({ error: "Unknown device." }, { status: 404 });
  }

  // Ownership check: the user must hold an ACTIVE subscription for this device.
  const sub = await getActiveSubscription(session.user.id, id);
  if (!sub) {
    return Response.json(
      { error: "You don't have an active subscription for this device." },
      { status: 403 },
    );
  }

  const result = await requestUnlockSession(id, session.user.id);
  return Response.json(result);
}
