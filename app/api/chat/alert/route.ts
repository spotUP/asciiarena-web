import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { checkRateLimit } from "@/lib/rateLimit";
import { alertRateLimitKey, buildAlertEvent } from "@/lib/chatAlert";
import { isParticipant } from "@/lib/chatThreadDb";

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

  // Authorize: active participant (group-aware) OR legacy message participation.
  let allowed = await isParticipant(threadId, myId);
  if (!allowed) {
    const rows = await prisma.$queryRaw<[{ ok: number }?]>`
      SELECT 1 AS ok FROM messages
      WHERE thread = ${threadId} AND (from_id = ${myId} OR to_id = ${myId})
      LIMIT 1
    `;
    allowed = !!rows[0];
  }
  if (!allowed) return apiError("Not a participant", 403);

  // One yell per 3s per user per thread.
  if (!checkRateLimit(alertRateLimitKey(myId, threadId), 1, 3000)) {
    return apiError("Slow down", 429);
  }

  broadcast(`thread:${threadId}`, buildAlertEvent(myId, myNick));
  return apiOk({ ok: true });
}
