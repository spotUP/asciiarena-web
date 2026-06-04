// Pure, DB-free helpers for deriving a `messages.thread` id.
//
// The `messages` table is shared by private mail, chat, and request-comment
// notifications. Threading uses the signed 32-bit `messages.thread` column.
//
// The ONLY safe new-thread id is the message's own auto-increment `id`
// (LAST_INSERT_ID()): it is globally unique, monotonic, and can never collide
// with another conversation. Two historically-broken schemes existed:
//
//   1. `UNIX_TIMESTAMP()*10000 + fromId` — overflowed the signed INT.
//   2. `IFNULL(MAX(thread)+1, 1)`        — picks max+1, which is the value the
//      NEXT auto-increment id will take, so a later "thread = own id" compose
//      collapses two unrelated conversations into one thread (corruption), and
//      it is non-idempotent / racy under concurrency.
//
// These helpers encode the invariants so they can be unit-tested without a DB.

// Largest value a signed 32-bit INT (the type of `messages.thread`) can hold.
export const MAX_THREAD_INT = 2147483647;

// A thread id is valid iff it is a positive integer within the signed-INT range.
export function isValidThreadId(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= MAX_THREAD_INT;
}

// The canonical new-thread id: a freshly-inserted message's own auto-increment
// id. Replying re-uses the existing thread id, so passing the same existing id
// back through this function is the identity — i.e. threading is idempotent.
//
// `insertId` is whatever LAST_INSERT_ID() returned (number | bigint). Throws if
// it is missing, non-positive, or would overflow the signed-INT thread column —
// surfacing the bug loudly instead of silently writing a corrupt thread value.
export function deriveThreadId(insertId: number | bigint): number {
  const id = typeof insertId === "bigint" ? Number(insertId) : insertId;
  if (!isValidThreadId(id)) {
    throw new Error(`Invalid thread id derived from insert id: ${String(insertId)}`);
  }
  return id;
}
