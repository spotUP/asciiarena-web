import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { checkRateLimit } from "@/lib/rateLimit";
import { alertRateLimitKey, buildAlertEvent } from "@/lib/chatAlert";

const schema = z.object({
  threadId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid request", 400);

  const { threadId } = parsed.data;
  const myId = parseInt(session.user.id);
  const myNick = session.user.name ?? "";

  // Authorize: the user must belong to this thread. Until group chat ships this
  // is the 2-person model — a participant is anyone who sent or received a
  // message in the thread. (Group chat replaces this with chat_participants.)
  const rows = await prisma.$queryRaw<[{ ok: number }?]>`
    SELECT 1 AS ok FROM messages
    WHERE thread = ${threadId} AND (from_id = ${myId} OR to_id = ${myId})
    LIMIT 1
  `;
  if (!rows[0]) return apiError("Not a participant", 403);

  // One yell per 3s per user per thread.
  if (!checkRateLimit(alertRateLimitKey(myId, threadId), 1, 3000)) {
    return apiError("Slow down", 429);
  }

  broadcast(`thread:${threadId}`, buildAlertEvent(myId, myNick));
  return apiOk({ ok: true });
}
