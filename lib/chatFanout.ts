// Who gets notified when a message is posted to an existing thread.
//
// Pure, so the rule can be tested without a database. DB access stays in
// lib/chatThreadDb.ts.

export interface FanoutInput {
  /** Active participants other than the sender. Excludes anyone who left. */
  activeOthers: number[];
  /**
   * Whether the thread has any chat_participants rows at all. False means the
   * thread predates the participants table and its membership is unknown --
   * NOT that everyone left.
   */
  threadHasParticipants: boolean;
  /** Recipient id supplied by the client, for legacy threads. */
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
  if (input.threadHasParticipants) return [];
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
