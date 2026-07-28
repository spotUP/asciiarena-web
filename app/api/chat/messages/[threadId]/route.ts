import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { getMember } from "@/lib/chatThreadDb";
import { isOwnMessage } from "@/lib/chatUnread";

export const dynamic = "force-dynamic";

interface Row {
  id: number; thread: number; from_id: number | null;
  postername: string | null; postedto: string | null;
  message: string | null; timestamp: number | null; unread: boolean;
}

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

  const member = await getMember(thread, userId);

  // --- Participant path (group-aware) ---------------------------------------
  if (member) {
    // Visibility window enforced in SQL so LIMIT can't hide valid rows: a member
    // who left while later messages piled up still gets their last 30 visible.
    // (NULL-timestamp legacy rows fail `timestamp >= joinedAt` and are excluded;
    // such rows are vanishingly rare and never carry chat content.)
    const rows = member.leftAt == null
      ? await prisma.$queryRaw<Row[]>`
          SELECT id, thread, from_id, postername, postedto, message, timestamp, unread
          FROM messages
          WHERE thread = ${thread} AND timestamp >= ${member.joinedAt}
          ORDER BY id DESC LIMIT 30`
      : await prisma.$queryRaw<Row[]>`
          SELECT id, thread, from_id, postername, postedto, message, timestamp, unread
          FROM messages
          WHERE thread = ${thread} AND timestamp >= ${member.joinedAt} AND timestamp <= ${member.leftAt}
          ORDER BY id DESC LIMIT 30`;
    return apiOk(rows.map(r => {
      const isOwn = isOwnMessage({ fromId: r.from_id, postername: r.postername }, userId, userNick);
      const unread = !isOwn && (r.timestamp ?? 0) > member.lastReadAt;
      return {
        id: r.id, thread: r.thread, from_id: r.from_id,
        postername: r.postername, postedto: r.postedto,
        message: r.message, timestamp: r.timestamp, unread,
      };
    }));
  }

  // --- Legacy fallback (no chat_participants row) ---------------------------
  const participation = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*) AS cnt FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
  `;
  if (Number(participation[0]?.cnt ?? 0) === 0) return apiError("Forbidden", 403);

  const peerRow = await prisma.$queryRaw<Array<{ peer_id: number | null }>>`
    SELECT DISTINCT CASE WHEN from_id = ${userId} THEN to_id ELSE from_id END AS peer_id
    FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
      AND CASE WHEN from_id = ${userId} THEN to_id ELSE from_id END IS NOT NULL
    LIMIT 1
  `;
  const peerId = peerRow[0]?.peer_id == null ? null : Number(peerRow[0].peer_id);
  const peerNickRow = peerId == null ? null : await prisma.users.findUnique({
    where: { id: peerId }, select: { nick: true },
  });
  const peerNick = peerNickRow?.nick ?? null;

  const rows = peerId == null
    ? await prisma.$queryRaw<Row[]>`
        SELECT id, thread, from_id, postername, postedto, message, timestamp, unread
        FROM messages WHERE thread = ${thread}
        ORDER BY id DESC LIMIT 30`
    : await prisma.$queryRaw<Row[]>`
        SELECT id, thread, from_id, postername, postedto, message, timestamp, unread
        FROM messages
        WHERE thread = ${thread}
          OR (from_id = ${userId} AND to_id = ${peerId})
          OR (from_id = ${peerId} AND to_id = ${userId})
          OR (${peerNick ?? ""} <> '' AND (
                 (postername = ${userNick} AND postedto = ${peerNick ?? ""})
              OR (postername = ${peerNick ?? ""} AND postedto = ${userNick})
             ))
        ORDER BY id DESC LIMIT 30`;

  return apiOk(rows.map(r => {
    const isOwn = isOwnMessage({ fromId: r.from_id, postername: r.postername }, userId, userNick);
    return {
      id: r.id, thread: r.thread, from_id: r.from_id,
      postername: r.postername, postedto: r.postedto,
      message: r.message, timestamp: r.timestamp, unread: !isOwn && !!r.unread,
    };
  }));
}
