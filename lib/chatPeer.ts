// A direct message is between two DISTINCT users. Nothing modelled that, so a
// self-addressed DM was reachable from the chat composer -- and the 1:1 thread
// lookup, whose WHERE clause collapses to `from_id = me AND to_id = me` when
// the peer is the viewer, resolved it to whatever thread an old self-addressed
// row happened to belong to. On prod that was a group conversation with two
// other people.
//
// Pure, so every refusal site can share the rule without a database.

import { sameUserId, type UserIdLike } from "@/lib/userId";

export const SELF_DM_MESSAGE = "You cannot start a chat with yourself.";

/**
 * Whether this conversation would be the viewer talking to themselves.
 *
 * A missing or unparsable peer id is NOT a self-DM: callers validate the id on
 * its own, and reporting "you cannot chat with yourself" for a malformed
 * request would name the wrong problem.
 *
 * Id normalisation lives in lib/userId.ts because it is not a chat concern: a
 * peer id read through `$queryRaw` is a BigInt, and the first version of this
 * helper compared it with `===` against a number, so the guard in
 * /api/chat/user did nothing at all.
 */
export function isSelfDm(peerId: UserIdLike, selfId: UserIdLike): boolean {
  return sameUserId(peerId, selfId);
}
