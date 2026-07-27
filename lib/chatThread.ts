// Pure, DB-free logic for participant-based threads. Kept free of any prisma
// import so it unit-tests without a database connection. DB access lives in
// lib/chatThreadDb.ts.

export interface Member {
  userId: number;
  joinedAt: number;        // epoch seconds
  leftAt: number | null;   // null = still a member
  lastReadAt: number;      // epoch seconds
  title: string | null;    // per-user thread name override
  archivedAt?: number | null; // epoch seconds; null/undefined = not archived
}

export interface ThreadMessage {
  timestamp: number;
  fromId: number | null;
}

// A message is visible to a member iff it was posted within their membership
// window: at/after they joined, and (if they left) at/before they left.
export function isMessageVisible(member: Member, ts: number): boolean {
  if (ts < member.joinedAt) return false;
  if (member.leftAt != null && ts > member.leftAt) return false;
  return true;
}

// Unread = visible messages newer than the member's last_read_at that they did
// not send themselves.
export function countUnread(member: Member, msgs: ThreadMessage[], userId: number): number {
  let n = 0;
  for (const m of msgs) {
    if (!isMessageVisible(member, m.timestamp)) continue;
    if (m.timestamp <= member.lastReadAt) continue;
    if (m.fromId === userId) continue;
    n++;
  }
  return n;
}

// Fallback thread label when there's no subject: the other participants' nicks.
export function defaultThreadTitle(otherNicks: string[]): string {
  if (otherNicks.length === 0) return "(empty)";
  return otherNicks.join(", ");
}

// Per-user override (non-empty) → thread subject → derived nicks.
export function resolveDisplayTitle(
  override: string | null,
  subject: string | null,
  otherNicks: string[],
): string {
  if (override && override.trim()) return override;
  if (subject && subject.trim()) return subject;
  return defaultThreadTitle(otherNicks);
}

// A membership is "left" iff it carries a left_at timestamp. The inbox shows
// active threads; the "Left chats" view shows left ones. One predicate so both
// the list filter and the rejoin guard agree on what "left" means.
export function isLeftMember(member: Pick<Member, "leftAt">): boolean {
  return member.leftAt != null;
}

// A thread is hidden from the default inbox iff the member archived it AND
// nothing has been said since. Archiving is deliberately NOT sticky: it means
// "hide this until something happens", which is what makes it a safe,
// reversible alternative to leaving. A thread with no messages at all stays
// archived.
//
// One predicate for the SQL filter and the client-side list, so the two cannot
// disagree about which threads the user should be seeing.
export function isArchived(
  member: Pick<Member, "archivedAt">,
  lastMessageTs: number | null,
): boolean {
  const archivedAt = member.archivedAt;
  if (archivedAt == null) return false;
  if (lastMessageTs == null) return true;
  return lastMessageTs <= archivedAt;
}

// Rejoin is a pure state transition on the participant row: clear left_at while
// PRESERVING the original joined_at, so the rejoined user regains their whole
// original history window plus everything posted since. (Contrast with a fresh
// add, which starts joined_at "now" and would hide the past.) Idempotent: an
// already-active member is returned unchanged.
export function rejoinTransition(member: Member): Member {
  if (member.leftAt == null) return member;
  return { ...member, leftAt: null };
}
