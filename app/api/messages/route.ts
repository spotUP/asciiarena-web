import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";

const postSchema = z.object({
  subject: z.string().min(1).max(500),
  msgtext: z.string().min(1).max(10000),
  receiver: z.number().int().positive(),
});

interface MessageRow {
  total_count: bigint | number;
  id: number;
  thread: number;
  from_id: number | null;
  to_id: number | null;
  postedto: string | null;
  postername: string | null;
  subject: string | null;
  message: string | null;
  new: number | null;
  timestamp: number | null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const box = parseInt(searchParams.get("box") ?? "1") || 1;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesize = Math.max(1, Math.min(200, parseInt(searchParams.get("pagesize") ?? "20") || 20));
  const offset = (page - 1) * pagesize;
  const userId = parseInt(session.user.id);

  // Get one row per thread (latest message) without triggering ONLY_FULL_GROUP_BY
  const col = box === 2 ? Prisma.raw("from_id") : Prisma.raw("to_id");
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*) OVER() AS total_count,
           m.id, m.thread, m.postedto, m.postername, m.subject, m.message, m.\`new\`, m.timestamp
    FROM messages m
    INNER JOIN (
      SELECT thread, MAX(id) AS max_id
      FROM messages
      WHERE ${col} = ${userId}
      GROUP BY thread
    ) t ON m.id = t.max_id
    ORDER BY m.timestamp DESC
    LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
  `;

  const result = (rows as MessageRow[]).map((r) => ({
    total_count: Number(r.total_count),
    id: r.id,
    thread: r.thread,
    from_id: r.from_id,
    to_id: r.to_id,
    postedto: r.postedto,
    postername: r.postername,
    subject: r.subject,
    message: r.message,
    new: r.new,
    timestamp: r.timestamp,
  }));

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
