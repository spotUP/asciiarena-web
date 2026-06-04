import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";
import { getMember, getActiveParticipants, markRead } from "@/lib/chatThreadDb";
import { createNotification } from "@/lib/notifications";
import { normalizeMessageText } from "@/lib/normalizeText";

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

  const member = await getMember(thread, userId);
  const lower = member ? member.joinedAt : 0;
  const upper = member?.leftAt ?? null;

  // Authorize: a member, OR (legacy) someone who sent/received in the thread.
  if (!member) {
    const part = await prisma.$queryRaw<[{ cnt: bigint }]>`
      SELECT COUNT(*) AS cnt FROM messages
      WHERE thread = ${thread} AND (to_id = ${userId} OR from_id = ${userId})
    `;
    if (Number(part[0]?.cnt ?? 0) === 0) return apiError("Forbidden", 403);
  }

  // Two concrete branches (MySQL): with vs without the upper (left_at) bound.
  const countRows = upper == null
    ? await prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(*) AS cnt FROM messages WHERE thread = ${thread} AND timestamp >= ${lower}`
    : await prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(*) AS cnt FROM messages WHERE thread = ${thread} AND timestamp >= ${lower} AND timestamp <= ${upper}`;
  const cnt = Number(countRows[0]?.cnt ?? 0);
  const maxpage = Math.max(1, Math.ceil(cnt / pagesize));
  const start = Math.max(0, (maxpage - page) * pagesize);

  if (member) await markRead(thread, userId);
  // Keep legacy flags in sync for any un-migrated reader.
  await prisma.$executeRaw`
    UPDATE messages SET \`new\` = 0, unread = 0 WHERE thread = ${thread} AND to_id = ${userId}
  `;

  const rows = upper == null
    ? await prisma.$queryRaw<ThreadMessageRow[]>`
        SELECT * FROM messages WHERE thread = ${thread} AND timestamp >= ${lower}
        ORDER BY id ASC LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(start))}`
    : await prisma.$queryRaw<ThreadMessageRow[]>`
        SELECT * FROM messages WHERE thread = ${thread} AND timestamp >= ${lower} AND timestamp <= ${upper}
        ORDER BY id ASC LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(start))}`;
  const result = rows.map(r => ({
    total_count: cnt, id: r.id, thread: r.thread, postedto: r.postedto,
    postername: r.postername, subject: r.subject, message: r.message,
    filename: r.attach_filename, timestamp: r.timestamp,
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
  const body = await request.json() as { thread?: number; subject?: string; msgtext?: string; receiver?: number };
  const thread = body.thread ?? parseInt(threadId);
  const subject = normalizeMessageText(body.subject?.trim() ?? "").trim() || "Re:";
  if (!body.msgtext) return apiError("msgtext required", 400);
  const msgtext = normalizeMessageText(body.msgtext);
  const fromId = parseInt(session.user.id);
  const fromNick = session.user.name ?? "";

  const active = await getActiveParticipants(thread);
  const others = active.map(p => p.userId).filter(id => id !== fromId);
  const toId = others.length === 1 ? others[0] : null;

  if (toId == null) {
    await prisma.$executeRaw`
      INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
      VALUES (${thread}, ${fromId}, NULL, NULL, (SELECT nick FROM users WHERE id = ${fromId}),
              UNIX_TIMESTAMP(), ${subject}, ${msgtext}, 1, 1)`;
  } else {
    await prisma.$executeRaw`
      INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
      VALUES (${thread}, ${fromId}, ${toId}, (SELECT nick FROM users WHERE id = ${toId}),
              (SELECT nick FROM users WHERE id = ${fromId}), UNIX_TIMESTAMP(), ${subject}, ${msgtext}, 1, 1)`;
  }

  broadcast(`thread:${thread}`, { type: "message" });
  const targets = others.length ? others : (body.receiver ? [body.receiver] : []);
  for (const rid of targets) {
    broadcast(`user:${rid}:messages`, { type: "message", fromId, fromNick, threadId: thread });
    await createNotification(rid, "notif-message", { actorNick: fromNick, targetUrl: `/messages?thread=${thread}` });
  }
  return apiOk({ status: true });
}
