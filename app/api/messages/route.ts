import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface MessageRow {
  total_count: bigint | number;
  id: number;
  thread: number;
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

  let rows: unknown[];
  if (box === 2) {
    rows = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT thread) OVER() AS total_count,
             id, thread, postedto, postername, subject, message, \`new\`, timestamp
      FROM messages
      WHERE from_id = ${userId}
      GROUP BY thread
      ORDER BY timestamp DESC
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT thread) OVER() AS total_count,
             id, thread, postedto, postername, subject, message, \`new\`, timestamp
      FROM messages
      WHERE to_id = ${userId}
      GROUP BY thread
      ORDER BY timestamp DESC
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
    `;
  }

  const result = (rows as MessageRow[]).map((r) => ({
    total_count: Number(r.total_count),
    id: r.id,
    thread: r.thread,
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

  const body = await request.json() as { subject?: string; msgtext?: string; receiver?: number };
  const { subject, msgtext, receiver } = body;

  if (!subject || !msgtext || !receiver) {
    return apiError("subject, msgtext and receiver are required", 400);
  }

  const fromId = parseInt(session.user.id);

  await prisma.$executeRaw`
    INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
    SELECT IFNULL(MAX(thread) + 1, 1), ${fromId}, ${receiver},
           (SELECT nick FROM users WHERE id = ${receiver}),
           (SELECT nick FROM users WHERE id = ${fromId}),
           UNIX_TIMESTAMP(), ${subject}, ${msgtext}, 1, 1
    FROM messages
  `;

  return apiOk({ status: true });
}
