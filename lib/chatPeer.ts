// A direct message is between two DISTINCT users. Nothing modelled that, so a
// self-addressed DM was reachable from the chat composer -- and the 1:1 thread
// lookup, whose WHERE clause collapses to `from_id = me AND to_id = me` when
// the peer is the viewer, resolved it to whatever thread an old self-addressed
// row happened to belong to. On prod that was a group conversation with two
// other people.
//
// Pure, so every refusal site can share the rule without a database.

export const SELF_DM_MESSAGE = "You cannot start a chat with yourself.";

/**
 * Whether this conversation would be the viewer talking to themselves.
 *
 * A missing or unparsable peer id is NOT a self-DM: callers validate the id on
 * its own, and reporting "you cannot chat with yourself" for a malformed
 * request would name the wrong problem.
 */
export function isSelfDm(peerId: number | null | undefined, selfId: number): boolean {
  if (peerId == null || !Number.isFinite(peerId)) return false;
  return peerId === selfId;
}
