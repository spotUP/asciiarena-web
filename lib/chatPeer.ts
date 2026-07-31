// A direct message is between two DISTINCT users. Nothing modelled that, so a
// self-addressed DM was reachable from the chat composer -- and the 1:1 thread
// lookup, whose WHERE clause collapses to `from_id = me AND to_id = me` when
// the peer is the viewer, resolved it to whatever thread an old self-addressed
// row happened to belong to. On prod that was a group conversation with two
// other people.
//
// Pure, so every refusal site can share the rule without a database.

export const SELF_DM_MESSAGE = "You cannot start a chat with yourself.";

type UserId = number | bigint | string | null | undefined;

// Ids reach this rule in three shapes and they must all compare equal:
// `parseInt` of a session id or query param (number), a Zod-parsed body field
// (number), and a column read back through Prisma's $queryRaw, which hands
// MySQL's INT UNSIGNED back as a BigInt. The first version of this helper
// tested `Number.isFinite(peerId)`, which is false for 2395n, so the guard in
// /api/chat/user silently did nothing -- and lib/db.ts patches
// BigInt.prototype.toJSON, so the response still looked like a plain number and
// the hole was invisible from the outside.
function toId(value: UserId): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Whether this conversation would be the viewer talking to themselves.
 *
 * A missing or unparsable peer id is NOT a self-DM: callers validate the id on
 * its own, and reporting "you cannot chat with yourself" for a malformed
 * request would name the wrong problem.
 */
export function isSelfDm(peerId: UserId, selfId: UserId): boolean {
  const peer = toId(peerId);
  const self = toId(selfId);
  return peer != null && self != null && peer === self;
}
