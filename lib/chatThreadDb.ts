import { prisma } from "@/lib/db";
import type { Member } from "@/lib/chatThread";

export interface ActiveParticipant {
  userId: number;
  nick: string;
  joinedAt: number;
}

// Active members of a thread (not left), with nicks for display/fan-out.
export async function getActiveParticipants(threadId: number): Promise<ActiveParticipant[]> {
  const rows = await prisma.$queryRaw<Array<{ user_id: number; nick: string; joined_at: number }>>`
    SELECT cp.user_id, u.nick, cp.joined_at
    FROM chat_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.thread_id = ${threadId} AND cp.left_at IS NULL
    ORDER BY cp.joined_at ASC
  `;
  return rows.map(r => ({ userId: Number(r.user_id), nick: r.nick, joinedAt: Number(r.joined_at) }));
}

// The caller's membership row (active or not), or null.
export async function getMember(threadId: number, userId: number): Promise<Member | null> {
  const rows = await prisma.$queryRaw<Array<{
    user_id: number; joined_at: number; left_at: number | null; last_read_at: number; title: string | null;
  }>>`
    SELECT user_id, joined_at, left_at, last_read_at, title
    FROM chat_participants WHERE thread_id = ${threadId} AND user_id = ${userId} LIMIT 1
  `;
  const r = rows[0];
  if (!r) return null;
  return {
    userId: Number(r.user_id),
    joinedAt: Number(r.joined_at),
    leftAt: r.left_at == null ? null : Number(r.left_at),
    lastReadAt: Number(r.last_read_at),
    title: r.title,
  };
}

// Active membership predicate (authorization).
export async function isParticipant(threadId: number, userId: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<[{ ok: number }?]>`
    SELECT 1 AS ok FROM chat_participants
    WHERE thread_id = ${threadId} AND user_id = ${userId} AND left_at IS NULL LIMIT 1
  `;
  return !!rows[0];
}

// Add a member (or re-activate a previously-left one with a fresh joined_at so
// they only see history from re-join). Idempotent for already-active members.
export async function addParticipant(threadId: number, userId: number): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO chat_participants (thread_id, user_id, joined_at, left_at, last_read_at, title)
    VALUES (${threadId}, ${userId}, UNIX_TIMESTAMP(), NULL, UNIX_TIMESTAMP(), NULL)
    ON DUPLICATE KEY UPDATE
      joined_at    = IF(left_at IS NULL, joined_at, UNIX_TIMESTAMP()),
      last_read_at = IF(left_at IS NULL, last_read_at, UNIX_TIMESTAMP()),
      left_at      = NULL
  `;
}

// Rejoin a thread the user previously left: clear left_at but PRESERVE the
// original joined_at, so the rejoined member regains their entire original
// history window plus everything posted while they were gone. No-op if the row
// is missing or already active. (addParticipant, by contrast, resets joined_at
// for a fresh add — wrong for rejoin, which must restore the past.)
export async function rejoinThread(threadId: number, userId: number): Promise<void> {
  await prisma.$executeRaw`
    UPDATE chat_participants SET left_at = NULL
    WHERE thread_id = ${threadId} AND user_id = ${userId} AND left_at IS NOT NULL
  `;
}

// Threads the user has LEFT (soft), newest activity first, each with the same
// title inputs the active inbox uses. History rows are preserved, so a left
// thread can still be read; this just surfaces it so the user can find it.
export interface LeftThreadRow {
  thread: number;
  lastTimestamp: number | null;
  overrideTitle: string | null;
  firstSubject: string | null;
  otherNicks: string | null;
}
export async function getLeftThreads(userId: number): Promise<LeftThreadRow[]> {
  const rows = await prisma.$queryRaw<Array<{
    thread: number; last_timestamp: number | null;
    override_title: string | null; first_subject: string | null; other_nicks: string | null;
  }>>`
    SELECT
      cp.thread_id AS thread,
      (SELECT lm.timestamp FROM messages lm
         WHERE lm.thread = cp.thread_id AND lm.timestamp >= cp.joined_at AND lm.timestamp <= cp.left_at
         ORDER BY lm.id DESC LIMIT 1) AS last_timestamp,
      cp.title AS override_title,
      (SELECT fm.subject FROM messages fm WHERE fm.thread = cp.thread_id ORDER BY fm.id ASC LIMIT 1) AS first_subject,
      (SELECT GROUP_CONCAT(u.nick ORDER BY pp.joined_at SEPARATOR 0x1f)
         FROM chat_participants pp JOIN users u ON u.id = pp.user_id
         WHERE pp.thread_id = cp.thread_id AND pp.user_id <> ${userId}) AS other_nicks
    FROM chat_participants cp
    WHERE cp.user_id = ${userId} AND cp.left_at IS NOT NULL
    ORDER BY cp.left_at DESC
  `;
  return rows.map(r => ({
    thread: Number(r.thread),
    lastTimestamp: r.last_timestamp == null ? null : Number(r.last_timestamp),
    overrideTitle: r.override_title,
    firstSubject: r.first_subject,
    otherNicks: r.other_nicks,
  }));
}

export async function leaveThread(threadId: number, userId: number): Promise<void> {
  await prisma.$executeRaw`
    UPDATE chat_participants SET left_at = UNIX_TIMESTAMP()
    WHERE thread_id = ${threadId} AND user_id = ${userId} AND left_at IS NULL
  `;
}

export async function markRead(threadId: number, userId: number): Promise<void> {
  await prisma.$executeRaw`
    UPDATE chat_participants SET last_read_at = UNIX_TIMESTAMP()
    WHERE thread_id = ${threadId} AND user_id = ${userId}
  `;
}

export async function renameThread(threadId: number, userId: number, title: string): Promise<void> {
  const value = title.trim() === "" ? null : title.trim().slice(0, 128);
  await prisma.$executeRaw`
    UPDATE chat_participants SET title = ${value}
    WHERE thread_id = ${threadId} AND user_id = ${userId}
  `;
}
