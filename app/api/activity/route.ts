import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcastActivityIfAllowed } from "@/lib/activity";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["view", "comment"]),
  target: z.string().min(1).max(200),
  targetUrl: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.name) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  const { type, target, targetUrl } = parsed.data;
  const nick = session.user.name;
  const userId = parseInt(session.user.id);

  await broadcastActivityIfAllowed(userId, type, {
    type,
    nick,
    target,
    targetUrl,
    timestamp: Math.floor(Date.now() / 1000),
  });

  return apiOk({ ok: true });
}
