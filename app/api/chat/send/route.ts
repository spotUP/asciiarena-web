import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";

const schema = z.object({
  peerId: z.number().int().positive(),
  message: z.string().min(1).max(10000),
  threadId: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid request", 400);

  const { peerId, message, threadId: existingThreadId } = parsed.data;
  const fromId = parseInt(session.user.id);
  const fromNick = session.user.name ?? "";

  if (existingThreadId) {
    // Reply to existing thread
    await prisma.$executeRaw`
      INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
      VALUES (
        ${existingThreadId}, ${fromId}, ${peerId},
        (SELECT nick FROM users WHERE id = ${peerId}),
        (SELECT nick FROM users WHERE id = ${fromId}),
        UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
      )
    `;

    broadcast(`thread:${existingThreadId}`, { type: "message" });
    broadcast(`user:${peerId}:messages`, { type: "message", fromId, fromNick, threadId: existingThreadId });

    return apiOk({ ok: true, threadId: existingThreadId });
  }

  // First message — INSERT, then SELECT LAST_INSERT_ID(), then UPDATE thread = id.
  // These three queries MUST share one MySQL connection or LAST_INSERT_ID() returns 0
  // (it's connection-scoped). Without the transaction, Prisma's pool can hand each
  // query a different connection and the thread id silently becomes 0.
  const threadId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO messages (from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
      VALUES (
        ${fromId}, ${peerId},
        (SELECT nick FROM users WHERE id = ${peerId}),
        (SELECT nick FROM users WHERE id = ${fromId}),
        UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
      )
    `;
    const inserted = await tx.$queryRaw<[{ msgId: number }]>`SELECT LAST_INSERT_ID() AS msgId`;
    const msgId = Number(inserted[0]?.msgId ?? 0);
    if (!msgId) throw new Error("LAST_INSERT_ID returned 0");
    await tx.$executeRaw`UPDATE messages SET thread = ${msgId} WHERE id = ${msgId}`;
    return msgId;
  });

  broadcast(`thread:${threadId}`, { type: "message" });
  broadcast(`user:${peerId}:messages`, { type: "message", fromId, fromNick, threadId });

  return apiOk({ ok: true, threadId });
}
