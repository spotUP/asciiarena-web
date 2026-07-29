import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";
import { resolveDisplayTitle } from "@/lib/chatThread";
import { addParticipant, getLeftThreads, getMember } from "@/lib/chatThreadDb";
import { createNotification } from "@/lib/notifications";
import { normalizeMessageText } from "@/lib/normalizeText";
import { truncatePreview } from "@/lib/inboxRow";
import { unreadCountExpr } from "@/lib/chatUnreadSql";
import { isOwnMessage } from "@/lib/chatUnread";

// One line in a 400px dropdown; longer subjects only wrap.
const NOTIFICATION_PREVIEW_MAX = 60;

// `receiver` (single) is the original contract; `receivers` (many) starts a
// group thread from the composer. Exactly one of them must be present.
const postSchema = z.object({
  subject: z.string().min(1).max(500).transform(normalizeMessageText),
  msgtext: z.string().min(1).max(10000).transform(normalizeMessageText),
  receiver: z.number().int().positive().optional(),
  receivers: z.array(z.number().int().positive()).min(1).max(20).optional(),
}).refine(v => v.receiver != null || (v.receivers?.length ?? 0) > 0, {
  message: "receiver or receivers required",
});

// Participants arrive as "id:nick" joined by 0x1f — one GROUP_CONCAT rather
// than two that could disagree about ordering. A nick cannot contain 0x1f, and
// splitting the id off at the FIRST colon keeps nicks containing ":" intact.
function parseParticipants(concat: string | null): Array<{ id: number; nick: string }> {
  if (!concat) return [];
  return concat.split(String.fromCharCode(0x1f)).flatMap(entry => {
    const at = entry.indexOf(":");
    if (at < 0) return [];
    const id = Number(entry.slice(0, at));
    const nick = entry.slice(at + 1);
    return Number.isFinite(id) && nick ? [{ id, nick }] : [];
  });
}

type InboxRawRow = {
  thread: number; id: number; from_id: number | null; postername: string | null;
  message: string | null; timestamp: number | null; total_count: bigint | number;
  override_title: string | null; first_subject: string | null;
  other_nicks: string | null; unread: bigint | number; archived_at: number | null;
};

/**
 * The inbox row query. One definition, used by the list views and by the
 * single-thread deep-link lookup, so a deep-linked row cannot report different
 * flags from the row the list would have shown for the same thread.
 *
 * `threadId` selects one thread and deliberately drops the archived/search/
 * unread filters: a deep link must resolve whatever state the thread is in, and
 * report that state truthfully rather than filtering the row away.
 */
function selectInboxRows(
  me: number,
  myNick: string,
  opts: { threadId?: number; archived?: boolean; search?: string; unreadOnly?: boolean; pagesize: number; offset: number },
): Promise<InboxRawRow[]> {
  const unreadExpr = unreadCountExpr(me, myNick);
  const single = opts.threadId != null;

  const archivedCond = single
    ? Prisma.empty
    : opts.archived
      ? Prisma.sql`AND (cp.archived_at IS NOT NULL AND lm.timestamp <= cp.archived_at)`
      : Prisma.sql`AND (cp.archived_at IS NULL OR lm.timestamp > cp.archived_at)`;

  const threadCond = single ? Prisma.sql`AND cp.thread_id = ${opts.threadId}` : Prisma.empty;

  const q = (opts.search ?? "").trim();
  const search = !single && q
    ? Prisma.sql`AND (
        EXISTS (SELECT 1 FROM messages sm WHERE sm.thread = cp.thread_id AND sm.subject LIKE ${"%" + q + "%"})
        OR EXISTS (SELECT 1 FROM chat_participants sp JOIN users su ON su.id = sp.user_id
                   WHERE sp.thread_id = cp.thread_id AND sp.user_id <> ${me} AND su.nick LIKE ${"%" + q + "%"})
      )`
    : Prisma.empty;

  const unreadOnly = !single && opts.unreadOnly ? Prisma.sql`AND ${unreadExpr} > 0` : Prisma.empty;

  return prisma.$queryRaw<InboxRawRow[]>`
    SELECT
      cp.thread_id AS thread,
      lm.id, lm.from_id, lm.postername, lm.message, lm.timestamp,
      COUNT(*) OVER() AS total_count,
      cp.title AS override_title,
      cp.archived_at,
      (SELECT fm.subject FROM messages fm WHERE fm.thread = cp.thread_id ORDER BY fm.id ASC LIMIT 1) AS first_subject,
      (SELECT GROUP_CONCAT(CONCAT(u.id, ':', u.nick) ORDER BY pp.joined_at SEPARATOR 0x1f)
         FROM chat_participants pp JOIN users u ON u.id = pp.user_id
         WHERE pp.thread_id = cp.thread_id AND pp.left_at IS NULL AND pp.user_id <> ${me}) AS other_nicks,
      ${unreadExpr} AS unread
    FROM chat_participants cp
    JOIN messages lm ON lm.id = (
      SELECT m2.id FROM messages m2
      WHERE m2.thread = cp.thread_id AND m2.timestamp >= cp.joined_at
      ORDER BY m2.id DESC LIMIT 1
    )
    WHERE cp.user_id = ${me} AND cp.left_at IS NULL
      ${threadCond}
      ${archivedCond}
      ${search}
      ${unreadOnly}
    ORDER BY lm.timestamp DESC
    LIMIT ${Prisma.raw(String(opts.pagesize))} OFFSET ${Prisma.raw(String(opts.offset))}
  `;
}

/** Row shape for a thread the caller is still in. */
function activeRow(r: InboxRawRow, me: number, myNick: string) {
  const subject = r.first_subject === "Chat" ? null : r.first_subject;
  const participants = parseParticipants(r.other_nicks);
  return {
    total_count: Number(r.total_count),
    thread: r.thread,
    id: r.id,
    from_id: r.from_id,
    lastFromMe: isOwnMessage({ fromId: r.from_id, postername: r.postername }, me, myNick),
    preview: r.message,
    lastSenderNick: r.postername,
    timestamp: r.timestamp,
    // Kept for the chat dock / ChatWindow, which still take one string.
    title: resolveDisplayTitle(r.override_title, subject, participants.map(p => p.nick)),
    // The parts the inbox list needs; a single pre-formatted title cannot
    // express "subject AND who is in the thread".
    overrideTitle: r.override_title,
    subject,
    participants,
    unread: Number(r.unread),
    left: false,
    archived: r.archived_at != null,
  };
}

/** Row shape for a thread the caller has left. No unread: they receive nothing until they rejoin. */
function leftRow(r: Awaited<ReturnType<typeof getLeftThreads>>[number], totalCount: number) {
  const subject = r.firstSubject === "Chat" ? null : r.firstSubject;
  const participants = parseParticipants(r.otherNicks);
  return {
    total_count: totalCount,
    thread: r.thread,
    id: r.thread,
    from_id: null,
    lastFromMe: false,
    preview: null,
    lastSenderNick: null,
    timestamp: r.lastTimestamp,
    title: resolveDisplayTitle(r.overrideTitle, subject, participants.map(p => p.nick)),
    overrideTitle: r.overrideTitle,
    subject,
    participants,
    unread: 0,
    left: true,
    archived: false,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesize = Math.max(1, Math.min(200, parseInt(searchParams.get("pagesize") ?? "50") || 50));
  const offset = (page - 1) * pagesize;
  const me = parseInt(session.user.id);
  // Legacy chat rows carry no from_id, only the sender's nick.
  const myNick = session.user.name ?? "";

  // Single-thread mode, for a deep link like /messages?thread=2269.
  //
  // The client used to synthesise this row from the members endpoint when the
  // thread was absent from the current list, hardcoding `left: false` and
  // `archived: false` because that endpoint cannot report them. For a thread the
  // user had LEFT that was a lie with real consequences: the row rendered a
  // ChatWindow instead of "You left this chat -- Rejoin to read it", and the
  // messages endpoint then clamped the history to `timestamp <= left_at`. The
  // user got a truncated conversation, no explanation, and no Rejoin button.
  // That is how diNO could not read /messages?thread=2269.
  //
  // Membership state is knowable, so it is looked up rather than assumed, and it
  // deliberately reuses the same two mappers as the list views so a deep-linked
  // row cannot drift from the row the inbox would have shown.
  const singleThread = searchParams.get("thread");
  if (singleThread != null) {
    const wanted = parseInt(singleThread);
    if (!Number.isFinite(wanted)) return apiError("invalid thread", 400);
    const member = await getMember(wanted, me);
    // Not a participant at all: no row. The page falls back to the plain list,
    // which is what it did before this mode existed.
    if (!member) return apiOk([]);
    if (member.leftAt != null) {
      const left = await getLeftThreads(me);
      const row = left.find(r => r.thread === wanted);
      return apiOk(row ? [leftRow(row, 1)] : []);
    }
    const rows = await selectInboxRows(me, myNick, {
      threadId: wanted,
      pagesize: 1,
      offset: 0,
    });
    return apiOk(rows.map(r => activeRow(r, me, myNick)));
  }

  // "Left chats" view: threads the user soft-left. History is preserved, so the
  // user can find, read, and rejoin them. Same title resolution as the active
  // inbox; no unread (a left member receives nothing until they rejoin).
  if (searchParams.get("left") === "1") {
    const left = await getLeftThreads(me);
    return apiOk(left.map(r => leftRow(r, left.length)));
  }

  // Active-participant threads, each with its latest message visible to me, the
  // cursor-based unread count, and the raw inputs for title resolution.
  // Archived threads are hidden from the default list until a message newer
  // than archived_at arrives — the SQL mirror of isArchived() in
  // lib/chatThread.ts. `?archived=1` shows exactly the complement.
  const rows = await selectInboxRows(me, myNick, {
    archived: searchParams.get("archived") === "1",
    search: searchParams.get("q") ?? "",
    unreadOnly: searchParams.get("unread") === "1",
    pagesize,
    offset,
  });

  return apiOk(rows.map(r => activeRow(r, me, myNick)));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { subject, msgtext } = parsed.data;

  const fromId = parseInt(session.user.id);
  // One thread, N recipients. Deduped and with the sender removed, so picking
  // yourself (or the same nick twice) cannot create a bogus participant row.
  const recipients = Array.from(new Set(
    (parsed.data.receivers ?? [parsed.data.receiver!]).filter(id => id !== fromId),
  ));
  if (recipients.length === 0) return apiError("Pick at least one other recipient", 400);
  // messages.to_id is a single column: the row is addressed to the first
  // recipient, and chat_participants is what actually defines membership.
  const receiver = recipients[0];

  const threadId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO messages (from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
      VALUES (
        ${fromId}, ${receiver},
        (SELECT nick FROM users WHERE id = ${receiver}),
        (SELECT nick FROM users WHERE id = ${fromId}),
        UNIX_TIMESTAMP(), ${subject}, ${msgtext}, 1, 1
      )`;
    const inserted = await tx.$queryRaw<[{ msgId: number }]>`SELECT LAST_INSERT_ID() AS msgId`;
    const msgId = Number(inserted[0]?.msgId ?? 0);
    if (!msgId) throw new Error("LAST_INSERT_ID returned 0");
    await tx.$executeRaw`UPDATE messages SET thread = ${msgId} WHERE id = ${msgId}`;
    return msgId;
  });
  const fromNick = session.user.name ?? "";

  if (threadId) {
    await addParticipant(threadId, fromId);
    for (const id of recipients) await addParticipant(threadId, id);
  }

  for (const id of recipients) {
    broadcast(`user:${id}:messages`, { type: "message", fromId, fromNick, threadId });
    // Carry the subject so the bell says WHICH message arrived, not just that
    // one did. notifications.target is VarChar(255).
    await createNotification(id, "notif-message", {
      actorNick: fromNick,
      target: truncatePreview(subject, NOTIFICATION_PREVIEW_MAX),
      targetUrl: `/messages?thread=${threadId}`,
    });
  }

  return apiOk({ status: true, threadId });
}
