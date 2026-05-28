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
  const userNick = session.user.name ?? "";

  const participation = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*) AS cnt FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
  `;
  if (Number(participation[0]?.cnt ?? 0) === 0) return apiError("Forbidden", 403);

  // Resolve the peer for this thread by inspecting any participating row.
  const peerRow = await prisma.$queryRaw<Array<{ peer_id: number | null }>>`
    SELECT DISTINCT CASE WHEN from_id = ${userId} THEN to_id ELSE from_id END AS peer_id
    FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
      AND CASE WHEN from_id = ${userId} THEN to_id ELSE from_id END IS NOT NULL
    LIMIT 1
  `;
  // $queryRaw returns the int unsigned columns as JS bigints; users.id is
  // an Int in Prisma so we have to narrow before passing it on.
  const peerId = peerRow[0]?.peer_id == null ? null : Number(peerRow[0].peer_id);

  // Resolve the peer nick from users so we can also match nick-based rows.
  // Legacy PHP wrote `postername`/`postedto` (nick strings) without setting
  // numeric from_id/to_id; without nick matching those rows are invisible.
  const peerNickRow = peerId == null ? null : await prisma.users.findUnique({
    where: { id: peerId },
    select: { nick: true },
  });
  const peerNick = peerNickRow?.nick ?? null;

  // Once we know the pair, pull every message between them regardless of
  // thread number. We try both ID-based AND nick-based pairings so legacy
  // rows (where one or both of from_id/to_id are NULL but postername /
  // postedto carry the nicks) surface alongside the modern rows.
  const rows = peerId == null
    ? await prisma.$queryRaw<Array<{
        id: number; thread: number; from_id: number | null;
        postername: string | null; postedto: string | null;
        message: string | null; timestamp: number | null;
        unread: boolean;
      }>>`
        SELECT id, thread, from_id, postername, postedto, message, timestamp, unread
        FROM messages WHERE thread = ${thread}
        ORDER BY id DESC LIMIT 30
      `
    : await prisma.$queryRaw<Array<{
        id: number; thread: number; from_id: number | null;
        postername: string | null; postedto: string | null;
        message: string | null; timestamp: number | null;
        unread: boolean;
      }>>`
        SELECT id, thread, from_id, postername, postedto, message, timestamp, unread
        FROM messages
        WHERE
          -- Anything in the modern thread, regardless of how from/to are set.
          -- Catches legacy rows where from_id is NULL but the thread is shared.
          thread = ${thread}
          -- Modern (id-based) pair match anywhere it exists.
          OR (from_id = ${userId} AND to_id = ${peerId})
          OR (from_id = ${peerId} AND to_id = ${userId})
          -- Legacy nick-based pair match (postername/postedto only).
          OR (${peerNick ?? ""} <> '' AND (
                 (postername = ${userNick} AND postedto = ${peerNick ?? ""})
              OR (postername = ${peerNick ?? ""} AND postedto = ${userNick})
             ))
        ORDER BY id DESC LIMIT 30
      `;

  // Return newest-first; client reverses for display.
  // `unread` is reported only for messages received by the caller — own
  // messages are always considered read. Treat the row as "ours" when
  // either from_id matches OR the legacy postername matches our nick.
  return apiOk(rows.map(r => {
    const isOwn = r.from_id === userId || (r.from_id == null && r.postername === userNick);
    return {
      id: r.id,
      thread: r.thread,
      from_id: r.from_id,
      postername: r.postername,
      postedto: r.postedto,
      message: r.message,
      timestamp: r.timestamp,
      unread: !isOwn && !!r.unread,
    };
  }));
}
