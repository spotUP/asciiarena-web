import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { createNotification } from "@/lib/notifications";
import { truncatePreview } from "@/lib/inboxRow";

// The dropdown gives each notification one line; a chat preview longer than
// this just gets clipped by the 400px panel anyway.
const NOTIFICATION_PREVIEW_MAX = 60;
import { addParticipant, getActiveParticipants } from "@/lib/chatThreadDb";
import { normalizeMessageText } from "@/lib/normalizeText";

const schema = z.object({
  peerId: z.number().int().positive(),
  message: z.string().min(1).max(10000).transform(normalizeMessageText),
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

  let threadId: number;

  if (existingThreadId) {
    threadId = existingThreadId;
    // to_id: the single peer for a 2-person thread, NULL for a group (3+ active).
    // Two concrete branches because the group case also nulls `postedto`.
    const active = await getActiveParticipants(threadId);
    if (active.length > 2) {
      await prisma.$executeRaw`
        INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
        VALUES (
          ${threadId}, ${fromId}, NULL, NULL,
          (SELECT nick FROM users WHERE id = ${fromId}),
          UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
        )`;
    } else {
      await prisma.$executeRaw`
        INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
        VALUES (
          ${threadId}, ${fromId}, ${peerId},
          (SELECT nick FROM users WHERE id = ${peerId}),
          (SELECT nick FROM users WHERE id = ${fromId}),
          UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
        )`;
    }
  } else {
    // First message — create the thread, then its two participant rows.
    threadId = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO messages (from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
        VALUES (
          ${fromId}, ${peerId},
          (SELECT nick FROM users WHERE id = ${peerId}),
          (SELECT nick FROM users WHERE id = ${fromId}),
          UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
        )`;
      const inserted = await tx.$queryRaw<[{ msgId: number }]>`SELECT LAST_INSERT_ID() AS msgId`;
      const msgId = Number(inserted[0]?.msgId ?? 0);
      if (!msgId) throw new Error("LAST_INSERT_ID returned 0");
      await tx.$executeRaw`UPDATE messages SET thread = ${msgId} WHERE id = ${msgId}`;
      return msgId;
    });
    await addParticipant(threadId, fromId);
    await addParticipant(threadId, peerId);
  }

  // Fan out to every active participant except the sender.
  const active = await getActiveParticipants(threadId);
  const recipients = active.map(p => p.userId).filter(id => id !== fromId);
  // Legacy fallback: if participants weren't created, deliver to the peer.
  const targets = recipients.length > 0 ? recipients : (peerId !== fromId ? [peerId] : []);

  // fromId so a window belonging to the AUTHOR does not count their own
  // message as unread -- lib/chatUnread.ts.
  broadcast(`thread:${threadId}`, { type: "message", fromId });
  for (const rid of targets) {
    broadcast(`user:${rid}:messages`, { type: "message", fromId, fromNick, threadId });
    // Chat messages have no subject (it is literally stored as "Chat"), so the
    // notification carries a preview of the text instead — otherwise the bell
    // says only that somebody said something.
    await createNotification(rid, "notif-message", {
      actorNick: fromNick,
      target: truncatePreview(message, NOTIFICATION_PREVIEW_MAX),
      targetUrl: `/messages?thread=${threadId}`,
    });
  }

  return apiOk({ ok: true, threadId });
}
