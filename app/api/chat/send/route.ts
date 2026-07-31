import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { createNotification } from "@/lib/notifications";
import { truncatePreview } from "@/lib/inboxRow";

import { addParticipant, getActiveParticipants, otherParticipantsEver } from "@/lib/chatThreadDb";
import { notifyTargets, addressedTo, isThreadReadOnly } from "@/lib/chatFanout";
import { normalizeMessageText } from "@/lib/normalizeText";
import { isSelfDm, SELF_DM_MESSAGE } from "@/lib/chatPeer";

// The dropdown gives each notification one line; a chat preview longer than
// this just gets clipped by the 400px panel anyway.
const NOTIFICATION_PREVIEW_MAX = 60;

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

  // Who the message is for. Resolved once, from membership, and used for both
  // the row's addressing and the notification fan-out so the two cannot
  // disagree. Previously membership was read twice and `to_id` came from the
  // client's `peerId` regardless of it, so a message could be addressed to
  // someone who had left the thread.
  let targets: number[] = [];

  if (existingThreadId) {
    threadId = existingThreadId;
    const active = await getActiveParticipants(threadId);
    const activeOthers = active.map(p => p.userId).filter(id => id !== fromId);
    const othersEver = await otherParticipantsEver(threadId, fromId);

    // A conversation everyone else has left is over. It used to accept messages
    // and drop them: the row was addressed to nobody and notified nobody, so one
    // member sent eight weeks of replies into a thread with no one in it. The
    // history stays readable; only posting is closed.
    if (isThreadReadOnly({ activeOthers, otherParticipantsEver: othersEver })) {
      return apiError("Everyone else has left this conversation, so it is read-only.", 409);
    }

    targets = notifyTargets({
      activeOthers,
      otherParticipantsEver: othersEver,
      clientReceiver: peerId !== fromId ? peerId : null,
    });
    // to_id: the sole recipient, or NULL when there is not exactly one — a
    // group, or a thread everyone else has left. The NULL case also nulls
    // `postedto`, hence two branches.
    const toId = addressedTo(targets);
    if (toId == null) {
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
          ${threadId}, ${fromId}, ${toId},
          (SELECT nick FROM users WHERE id = ${toId}),
          (SELECT nick FROM users WHERE id = ${fromId}),
          UNIX_TIMESTAMP(), 'Chat', ${message}, 1, 1
        )`;
    }
  } else {
    // A new conversation needs two distinct people. Guarded here rather than on
    // every send: for an EXISTING thread `peerId` is only a hint about the
    // recipient (membership decides, see notifyTargets above) and the client
    // legitimately posts the sender's own id as a group placeholder. It is
    // thread CREATION that would mint a self-addressed row, and those rows are
    // what made /api/chat/thread resolve a self peer to somebody else's thread.
    if (isSelfDm(peerId, fromId)) return apiError(SELF_DM_MESSAGE, 400);

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
    // A brand-new 1:1 thread: the peer is the recipient by definition, and the
    // participant rows just written say so.
    targets = [peerId];
  }

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
