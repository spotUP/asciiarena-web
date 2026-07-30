// Who gets notified when a message is posted to an existing thread.
//
// Pure, so the rule can be tested without a database. DB access stays in
// lib/chatThreadDb.ts.

export interface FanoutInput {
  /** Active participants other than the sender. Excludes anyone who left. */
  activeOthers: number[];
  /**
   * How many chat_participants rows exist for someone OTHER than the sender,
   * regardless of left_at. Zero means nobody else was ever recorded on this
   * thread, so its membership is unknown -- NOT that everyone left.
   *
   * Counting rows for the OTHER side specifically, rather than rows in general,
   * matters: 106 threads on prod carry exactly one participant row, the
   * sender's own, with the peer recorded only in messages.to_id. Treating "this
   * thread has participant rows" as "membership is known" reads those as
   * abandoned and silently stops delivering to the peer.
   */
  otherParticipantsEver: number;
  /** Recipient id supplied by the client, for threads with unknown membership. */
  clientReceiver: number | null;
}

/**
 * The rule /api/messages already states for the inbox -- "a left member receives
 * nothing until they rejoin" -- applied to notifications, which used to
 * contradict it.
 *
 * The client-supplied receiver is a fallback for legacy threads with no
 * participant rows, where nobody would otherwise be notified. It used to be
 * reached whenever there were no active others, which includes the case where
 * membership is known and says the other person LEFT: the sender's chat window
 * still holds them as its peer, so it posted their id and they were notified
 * anyway. On prod that had delivered 29 notifications to someone for threads
 * they had left, each linking to a conversation they could no longer read.
 *
 * So a known-empty thread notifies nobody, and only genuinely unknown
 * membership falls back to the client's word.
 */
export function notifyTargets(input: FanoutInput): number[] {
  if (input.activeOthers.length > 0) return input.activeOthers;
  // Others were recorded and none are active: they left, so nobody is notified.
  if (input.otherParticipantsEver > 0) return [];
  // Nobody else was ever recorded: membership is unknown, so trust the client.
  return input.clientReceiver != null ? [input.clientReceiver] : [];
}

/**
 * `messages.to_id` for a message sent to these targets.
 *
 * That column is the legacy addressing field: a single recipient, or NULL when
 * there isn't exactly one. It still drives the `new`/`unread` reset in
 * /api/chat/read, the 1:1 thread lookup in /api/chat/thread, and the
 * pre-participants authorisation fallbacks.
 *
 * Derived from the same targets as the notifications so the two cannot disagree
 * about who a message is for. It used to be written straight from the client's
 * `peerId`, which meant a message could be addressed to someone who had left the
 * thread — a row claiming a recipient that membership denies.
 */
export function addressedTo(targets: readonly number[]): number | null {
  return targets.length === 1 ? targets[0] : null;
}

/**
 * Whether a thread has nobody left to talk to, and is therefore read-only.
 *
 * A conversation whose other members have all left is over. Posting to it wrote
 * a row addressed to nobody and notified nobody: hARRiSONbERGEROn sent eight
 * weeks of messages into one, with no indication they were reaching no one. Once
 * the sender is alone, the composer is closed rather than silently swallowing
 * what they type. The history stays readable.
 *
 * Requires that others were once recorded. A thread where nobody else ever had a
 * participant row has unknown membership, not absent membership -- 106 threads
 * on prod look like that, with the peer named only in messages.to_id -- and
 * freezing those would close conversations nobody left. Only a thread that
 * positively records the others leaving is closed.
 */
export function isThreadReadOnly(input: {
  activeOthers: readonly number[];
  otherParticipantsEver: number;
}): boolean {
  return input.otherParticipantsEver > 0 && input.activeOthers.length === 0;
}
