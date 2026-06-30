import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcastActivityIfAllowed } from "@/lib/activity";
import { broadcast } from "@/lib/live";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["view", "comment"]),
  target: z.string().min(1).max(200),
  targetUrl: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  const { type, target, targetUrl } = parsed.data;
  const timestamp = Math.floor(Date.now() / 1000);

  if (session?.user?.id && session.user.name) {
    // Logged in: respects the user's per-type opt-out.
    await broadcastActivityIfAllowed(parseInt(session.user.id), type, {
      type, nick: session.user.name, target, targetUrl, timestamp,
    });
  } else {
    // Anonymous: only views, broadcast as "anon" (no prefs to consult).
    if (type !== "view") return apiError("Unauthorized", 401);
    broadcast("site:activity", { type: "view", nick: "anon", target, targetUrl, timestamp });
  }

  return apiOk({ ok: true });
}
