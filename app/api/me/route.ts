import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, isDbConfigured } from "@/lib/db";
import { subscriptions } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let subs: (typeof subscriptions.$inferSelect)[] = [];
  if (isDbConfigured) {
    subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id));
  }

  return Response.json({
    user: { id: session.user.id, email: session.user.email },
    subscriptions: subs,
  });
}
