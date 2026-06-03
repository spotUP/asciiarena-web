// Pure, DB-free logic for participant-based threads. Kept free of any prisma
// import so it unit-tests without a database connection. DB access lives in
// lib/chatThreadDb.ts.

export interface Member {
  userId: number;
  joinedAt: number;        // epoch seconds
  leftAt: number | null;   // null = still a member
  lastReadAt: number;      // epoch seconds
  title: string | null;    // per-user thread name override
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
