import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

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

  const countRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS cnt FROM messages WHERE thread = ${thread}
  `;
  const cnt = Number(countRows[0]?.cnt ?? 0);
  const maxpage = Math.ceil(cnt / pagesize);
  const start = Math.max(0, (maxpage - page) * pagesize);

  await prisma.$executeRaw`
    UPDATE messages SET \`new\` = 0 WHERE thread = ${thread} AND to_id = ${userId}
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
  const { subject, msgtext, receiver } = body;

  if (!subject || !msgtext || !receiver) {
    return apiError("subject, msgtext and receiver are required", 400);
  }

  const fromId = parseInt(session.user.id);

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

  return apiOk({ status: true });
}
