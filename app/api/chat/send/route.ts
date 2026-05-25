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

  // First message — create new thread
  await prisma.$executeRaw`
    INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
    VALUES (
      UNIX_TIMESTAMP() * 10000 + ${fromId},
      ${fromId}, ${peerId},
      (SELECT nick FROM users WHERE id = ${peerId}),
      (SELECT nick FROM users WHERE id = ${fromId}),
      UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
    )
  `;

  const inserted = await prisma.$queryRaw<[{ threadId: number }]>`
    SELECT thread AS threadId FROM messages WHERE id = LAST_INSERT_ID()
  `;
  const threadId = inserted[0]?.threadId;

  broadcast(`thread:${threadId}`, { type: "message" });
  broadcast(`user:${peerId}:messages`, { type: "message", fromId, fromNick, threadId });

  return apiOk({ ok: true, threadId });
}
