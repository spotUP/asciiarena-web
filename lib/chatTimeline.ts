// Merging "X left the conversation" notices into a thread's message history.
//
// Pure, so the ordering and windowing rules are testable without a database.

export interface TimelineMessage {
  id: number;
  timestamp: number | null;
  kind?: "left";
  nick?: string;
}

export interface LeaveNotice {
  participantId: number;
  nick: string;
  leftAt: number;
}

/**
 * A leave notice's synthetic id.
 *
 * The client keys rendered rows by id, so these must not collide with message
 * ids. Negative, derived from the chat_participants row id: stable across
 * reloads (so React reuses the same node) and unmistakably not a message.
 */
export function leaveNoticeId(participantId: number): number {
  return -participantId;
}

/**
 * Which departures belong in a slice of history, given the viewer's membership
 * window and the messages actually being returned.
 *
 * Two bounds, for two different reasons:
 *
 *   - The viewer's window. A member who left sees their own history up to
 *     `viewerLeftAt`; they should not learn about departures that happened after
 *     they were gone. Their own departure sits exactly on the boundary and is
 *     included, which is what makes their history end with "you left".
 *   - The returned slice. History is capped at the most recent messages, so a
 *     notice older than the oldest message shown would dangle above the visible
 *     conversation with nothing to anchor it.
 */
export function visibleLeaveNotices(
  notices: readonly LeaveNotice[],
  opts: {
    viewerJoinedAt: number;
    viewerLeftAt: number | null;
    oldestShownTimestamp: number | null;
  },
): LeaveNotice[] {
  return notices.filter(n => {
    if (n.leftAt < opts.viewerJoinedAt) return false;
    if (opts.viewerLeftAt != null && n.leftAt > opts.viewerLeftAt) return false;
    if (opts.oldestShownTimestamp != null && n.leftAt < opts.oldestShownTimestamp) return false;
    return true;
  });
}

/**
 * Merge notices into a newest-first message list, keeping it newest-first.
 *
 * The endpoint returns newest-first (`ORDER BY id DESC`) and the client reverses
 * it for display, so inserting in that same order is what puts each notice at
 * the point in the conversation where it happened.
 */
export function mergeLeaveNotices<T extends TimelineMessage>(
  newestFirst: readonly T[],
  notices: readonly LeaveNotice[],
): (T | TimelineMessage)[] {
  const asRows: TimelineMessage[] = notices.map(n => ({
    id: leaveNoticeId(n.participantId),
    timestamp: n.leftAt,
    kind: "left",
    nick: n.nick,
  }));
  return [...newestFirst, ...asRows].sort((a, b) => {
    const diff = (b.timestamp ?? 0) - (a.timestamp ?? 0);
    // Same second: the departure comes after the message it followed, which in
    // a newest-first list means before it.
    if (diff !== 0) return diff;
    if (a.kind === "left" && b.kind !== "left") return -1;
    if (b.kind === "left" && a.kind !== "left") return 1;
    return 0;
  });
}
