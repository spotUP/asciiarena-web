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

  // Find the peer for this thread so we can also fold in legacy messages
  // (thread = 0) between this user and the peer. Legacy rows were never
  // backfilled with a thread id; without this we'd show only one side of
  // every pre-migration conversation.
  const peerRow = await prisma.$queryRaw<Array<{ peer_id: number | null }>>`
    SELECT DISTINCT CASE WHEN from_id = ${userId} THEN to_id ELSE from_id END AS peer_id
    FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
    LIMIT 1
  `;
  const peerId = peerRow[0]?.peer_id ?? null;

  const rows = peerId == null
    ? await prisma.$queryRaw<Array<{
        id: number; thread: number; from_id: number | null;
        postername: string | null; postedto: string | null;
        message: string | null; timestamp: number | null;
      }>>`
        SELECT id, thread, from_id, postername, postedto, message, timestamp
        FROM messages WHERE thread = ${thread}
        ORDER BY id DESC LIMIT 30
      `
    : await prisma.$queryRaw<Array<{
        id: number; thread: number; from_id: number | null;
        postername: string | null; postedto: string | null;
        message: string | null; timestamp: number | null;
      }>>`
        SELECT id, thread, from_id, postername, postedto, message, timestamp
        FROM messages
        WHERE thread = ${thread}
           OR (thread = 0
               AND ((from_id = ${userId} AND to_id = ${peerId})
                 OR (from_id = ${peerId} AND to_id = ${userId})))
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
