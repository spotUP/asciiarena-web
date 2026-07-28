// One EventSource per channel per tab, shared by every component that wants it.
//
// This started life inside components/widgets/LiveRefresh.tsx, where it only
// ever served LiveRefresh instances. Everything else on the site opened its own
// connection, so a logged-in page with sidebars held ~10 concurrent SSE streams
// and two of the channels (user:{id}:messages, site:online) were subscribed
// twice over. The worst case was per-row components: OnlineDot opened a
// site:online stream *per instance*, so any list rendering a dot beside each
// author multiplied one channel by the row count.
//
// That matters because SSE streams are long-lived connections. On HTTP/1.1 the
// browser caps at 6 per host, so exhausting the pool makes every subsequent
// click and fetch hang while the server still looks healthy -- see the
// "clicks do nothing" checklist in
// thoughts/shared/handoffs/2026-06-11_deploy-postmortem.md. HTTP/2 raises the
// ceiling to 128 streams rather than removing it.
//
// Pooling also fixes the [N viewing] count. app/api/live/route.ts broadcasts a
// { type: "watching", count } event derived from subscriberCount(), so a tab
// that opened the same channel twice used to count itself twice.

export interface LiveEvent {
  type?: string;
  [key: string]: unknown;
}

/**
 * Called for every event on the channel. `null` means the payload failed to
 * parse as JSON -- passed through rather than swallowed so each caller decides
 * whether an unreadable event should still trigger its side effect.
 */
export type LiveSubscriber = (evt: LiveEvent | null) => void;

const pool = new Map<string, { es: EventSource; subs: Set<LiveSubscriber> }>();

/**
 * Subscribe to a live channel. Returns an unsubscribe function; the underlying
 * EventSource is closed once the last subscriber for that channel is gone.
 *
 * Events are delivered unfiltered -- filtering "watching" or "update" is each
 * caller's job, because the pool cannot know which of them a given consumer
 * cares about.
 */
export function subscribeRaw(channel: string, onEvent: LiveSubscriber): () => void {
  // Server-render and any non-browser environment: nothing to connect to.
  if (typeof EventSource === "undefined") return () => {};

  let entry = pool.get(channel);
  if (!entry) {
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
    const created = { es, subs: new Set<LiveSubscriber>() };
    pool.set(channel, created);
    es.onmessage = (e: MessageEvent<string>) => {
      let evt: LiveEvent | null = null;
      try {
        evt = JSON.parse(e.data) as LiveEvent;
      } catch {
        evt = null;
      }
      // Iterating the live Set is deliberate: a subscriber that unsubscribes a
      // peer mid-event should stop that peer from being called for this event
      // too. Set iteration already tolerates deleting the current element, so
      // unsubscribing yourself from your own callback is safe.
      for (const fn of created.subs) fn(evt);
    };
    entry = created;
  }
  entry.subs.add(onEvent);

  return () => {
    const e = pool.get(channel);
    if (!e) return;
    e.subs.delete(onEvent);
    if (e.subs.size === 0) {
      e.es.close();
      pool.delete(channel);
    }
  };
}

/** How many channels currently hold an open connection. Test/diagnostic use. */
export function openChannelCount(): number {
  return pool.size;
}
