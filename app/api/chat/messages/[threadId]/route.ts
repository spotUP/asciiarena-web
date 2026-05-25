import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { threadId } = await params;
  const thread = parseInt(threadId);
  const userId = parseInt(session.user.id);

  const participation = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*) AS cnt FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
  `;
  if (Number(participation[0]?.cnt ?? 0) === 0) return apiError("Forbidden", 403);

  const rows = await prisma.$queryRaw<Array<{
    id: number; thread: number; from_id: number | null;
    postername: string | null; postedto: string | null;
    message: string | null; timestamp: number | null;
  }>>`
    SELECT id, thread, from_id, postername, postedto, message, timestamp
    FROM messages WHERE thread = ${thread}
    ORDER BY id DESC LIMIT 30
  `;

  // Return newest-first; client reverses for display
  return apiOk(rows.map(r => ({
    id: r.id,
    thread: r.thread,
    from_id: r.from_id,
    postername: r.postername,
    postedto: r.postedto,
    message: r.message,
    timestamp: r.timestamp,
  })));
}
