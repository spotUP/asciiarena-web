/**
 * Whether an incoming chat event should raise a window's unread count.
 *
 * The `thread:<id>` live channel is a broadcast to everyone in the thread, the
 * author included -- that is what makes the author's own message appear in
 * their other open windows without a refetch. It also meant the author's own
 * message bumped the unread badge on their own minimized tab: a message you
 * just wrote is new to the recipient, never to you.
 *
 * `alert` events already carried a `fromId` and were already filtered on it
 * (components/chat/ChatBar.tsx); `message` events did not, so this is the same
 * rule in one testable place, used by both.
 */
/**
 * Whether a stored message was written by the viewer.
 *
 * 28 chat rows predate the group rewrite and carry no from_id at all -- the
 * sender is only recorded as a nick in `postername`. Every place that asks
 * "was this mine?" has to handle both, or those messages read as somebody
 * else's: counted as unread, and prefixed with a nick instead of "you".
 */
export function isOwnMessage(
  message: { fromId: number | null | undefined; postername: string | null | undefined },
  viewerId: number,
  viewerNick: string,
): boolean {
  if (message.fromId != null) return message.fromId === viewerId;
  return !!viewerNick && message.postername === viewerNick;
}

export function shouldCountAsUnread(args: {
  /** Author of the event. null when an old broadcast omitted it. */
  fromId: number | null | undefined;
  viewerId: number;
  /** A visible window marks itself read instead of counting. */
  minimized: boolean;
}): boolean {
  if (!args.minimized) return false;
  // An event with no author is counted: a missing id must not silently swallow
  // somebody else's message. Only a positive match on the viewer suppresses.
  return args.fromId !== args.viewerId;
}
