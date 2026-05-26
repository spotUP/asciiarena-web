import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";

interface ThreadMessageRow {
  id: number;
  thread: number;
  postedto: string | null;
  postername: string | null;
  subject: string | null;
  message: string | null;
  attach_filename: string | null;
  timestamp: number | null;
}

interface CountRow {
  cnt: bigint | number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { threadId } = await params;
  const thread = parseInt(threadId);
  const userId = parseInt(session.user.id);
  const pagesize = 20;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);

  // Verify user is a participant before exposing the thread
  const participation = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) AS cnt FROM messages
    WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
  `;
  if (Number(participation[0]?.cnt ?? 0) === 0) return apiError("Forbidden", 403);

  const countRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS cnt FROM messages WHERE thread = ${thread}
  `;
  const cnt = Number(countRows[0]?.cnt ?? 0);
  const maxpage = Math.ceil(cnt / pagesize);
  const start = Math.max(0, (maxpage - page) * pagesize);

  await prisma.$executeRaw`
    UPDATE messages SET \`new\` = 0, unread = 0 WHERE thread = ${thread} AND to_id = ${userId}
  `;

  const rows = await prisma.$queryRaw<ThreadMessageRow[]>`
    SELECT * FROM messages WHERE thread = ${thread}
    LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(start))}
  `;

  const result = rows.map((r) => ({
    total_count: cnt,
    id: r.id,
    thread: r.thread,
    postedto: r.postedto,
    postername: r.postername,
    subject: r.subject,
    message: r.message,
    filename: r.attach_filename,
    timestamp: r.timestamp,
  }));

  return apiOk(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { threadId } = await params;
  const body = await request.json() as {
    thread?: number;
    subject?: string;
    msgtext?: string;
    receiver?: number;
  };

  const thread = body.thread ?? parseInt(threadId);
  const { msgtext } = body;
  const subject = body.subject?.trim() || "Re:";

  if (!msgtext) return apiError("msgtext required", 400);

  const fromId = parseInt(session.user.id);
  const fromNick = session.user.name ?? "";

  // Determine receiver: prefer the value supplied by the client; otherwise look up
  // the other participant from the thread itself. This makes Reply work even when
  // replyid was missing or never resolved on the client side.
  let receiver = body.receiver ?? null;
  if (!receiver) {
    const rows = await prisma.$queryRaw<{ from_id: number | null; to_id: number | null }[]>`
      SELECT from_id, to_id FROM messages
      WHERE thread = ${thread}
        AND (from_id = ${fromId} OR to_id = ${fromId})
      ORDER BY id DESC LIMIT 1
    `;
    const row = rows[0];
    if (row) receiver = row.to_id === fromId ? row.from_id : row.to_id;
  }
  if (!receiver) return apiError("could not determine receiver", 400);

  await prisma.$executeRaw`
    INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
    VALUES (
      ${thread},
      ${fromId},
      ${receiver},
      (SELECT nick FROM users WHERE id = ${receiver}),
      (SELECT nick FROM users WHERE id = ${fromId}),
      UNIX_TIMESTAMP(),
      ${subject},
      ${msgtext},
      1,
      1
    )
  `;

  broadcast(`thread:${thread}`, { type: "message" });
  broadcast(`user:${receiver}:messages`, { type: "message", fromId, fromNick, threadId: thread });

  return apiOk({ status: true });
}
