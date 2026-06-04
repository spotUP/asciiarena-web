import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";
import { resolveDisplayTitle } from "@/lib/chatThread";

const postSchema = z.object({
  subject: z.string().min(1).max(500),
  msgtext: z.string().min(1).max(10000),
  receiver: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesize = Math.max(1, Math.min(200, parseInt(searchParams.get("pagesize") ?? "50") || 50));
  const offset = (page - 1) * pagesize;
  const me = parseInt(session.user.id);

  // Active-participant threads, each with its latest message visible to me, the
  // cursor-based unread count, and the raw inputs for title resolution. The
  // GROUP_CONCAT SEPARATOR is 0x1f (unit separator) so commas in a nick don't
  // break the split on the JS side.
  const rows = await prisma.$queryRaw<Array<{
    thread: number; id: number; from_id: number | null; postername: string | null;
    message: string | null; timestamp: number | null; total_count: bigint | number;
    override_title: string | null; first_subject: string | null;
    other_nicks: string | null; unread: bigint | number;
  }>>`
    SELECT
      cp.thread_id AS thread,
      lm.id, lm.from_id, lm.postername, lm.message, lm.timestamp,
      COUNT(*) OVER() AS total_count,
      cp.title AS override_title,
      (SELECT fm.subject FROM messages fm WHERE fm.thread = cp.thread_id ORDER BY fm.id ASC LIMIT 1) AS first_subject,
      (SELECT GROUP_CONCAT(u.nick ORDER BY pp.joined_at SEPARATOR 0x1f)
         FROM chat_participants pp JOIN users u ON u.id = pp.user_id
         WHERE pp.thread_id = cp.thread_id AND pp.left_at IS NULL AND pp.user_id <> ${me}) AS other_nicks,
      (SELECT COUNT(*) FROM messages um
         WHERE um.thread = cp.thread_id AND um.timestamp >= cp.joined_at
           AND um.timestamp > cp.last_read_at AND (um.from_id IS NULL OR um.from_id <> ${me})) AS unread
    FROM chat_participants cp
    JOIN messages lm ON lm.id = (
      SELECT m2.id FROM messages m2
      WHERE m2.thread = cp.thread_id AND m2.timestamp >= cp.joined_at
      ORDER BY m2.id DESC LIMIT 1
    )
    WHERE cp.user_id = ${me} AND cp.left_at IS NULL
    ORDER BY lm.timestamp DESC
    LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
  `;

  const result = rows.map(r => {
    const subject = r.first_subject === "Chat" ? null : r.first_subject;
    const nicks = r.other_nicks ? r.other_nicks.split(String.fromCharCode(0x1f)) : [];
    return {
      total_count: Number(r.total_count),
      thread: r.thread,
      id: r.id,
      from_id: r.from_id,
      lastFromMe: r.from_id === me,
      preview: r.message,
      timestamp: r.timestamp,
      title: resolveDisplayTitle(r.override_title, subject, nicks),
      unread: Number(r.unread),
    };
  });

  return apiOk(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { subject, msgtext, receiver } = parsed.data;

  const fromId = parseInt(session.user.id);

  await prisma.$executeRaw`
    INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
    VALUES (
      UNIX_TIMESTAMP() * 10000 + ${fromId},
      ${fromId}, ${receiver},
      (SELECT nick FROM users WHERE id = ${receiver}),
      (SELECT nick FROM users WHERE id = ${fromId}),
      UNIX_TIMESTAMP(), ${subject}, ${msgtext}, 1, 1
    )
  `;

  const inserted = await prisma.$queryRaw<[{ threadId: number }]>`
    SELECT thread AS threadId FROM messages WHERE id = LAST_INSERT_ID()
  `;
  const threadId = inserted[0]?.threadId;
  const fromNick = session.user.name ?? "";

  broadcast(`user:${receiver}:messages`, { type: "message", fromId, fromNick, threadId });

  return apiOk({ status: true, threadId });
}
