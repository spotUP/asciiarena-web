/**
 * Deep links into a conversation: /messages?thread=123.
 *
 * The messages page keeps the open thread in component state, seeded from the
 * URL. Clicking a bell notification while already on /messages is a same-route
 * navigation -- the query changes, the component does not remount -- so the
 * seed has to be re-applied when it changes, or the notification does nothing.
 */
export interface DeepLinkChange {
  /** The prop changed, so the synced value must be updated. */
  changed: boolean;
  /** Thread to open, or null to leave the reader on whatever is already open. */
  openThread: number | null;
}

export function deepLinkThreadChange(
  previous: number | null | undefined,
  incoming: number | null | undefined,
): DeepLinkChange {
  if (previous === incoming) return { changed: false, openThread: null };
  // A bare /messages names no thread. That must not collapse the conversation
  // the reader is currently looking at -- only a link that names a thread opens
  // one.
  return { changed: true, openThread: incoming ?? null };
}
