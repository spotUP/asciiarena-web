// One live connection per tab, carrying every channel the page subscribes to.
//
// This started life inside components/widgets/LiveRefresh.tsx, where it only
// ever served LiveRefresh instances. Everything else on the site opened its own
// connection, so a logged-in page with sidebars held ~10 concurrent SSE streams
// and two of the channels (user:{id}:messages, site:online) were subscribed
// twice over. The worst case was per-row components: OnlineDot opened a
// site:online stream *per instance*, so any list rendering a dot beside each
// author multiplied one channel by the row count.
//
// Pooling by channel fixed the duplicates but not the count: one connection per
// distinct channel still grows with every widget that wants live data, and a
// logged-in release page now asks for around twenty. That is the shape of the
// bug this file exists to prevent, and it kept coming back because the ceiling
// moved instead of the design:
//
//   2026-06-11  seven channels exhausted the browser's 6-connection HTTP/1.1
//               cap per host; every later click and fetch queued behind them
//               while the server looked healthy. Fixed by enabling HTTP/2.
//   2026-07-09  the same streams exhausted nginx worker_connections (768).
//               Fixed by raising it to 4096.
//   2026-08-06  eighteen channels on one HTTP/2 connection; when that
//               connection died (ERR_HTTP2_PING_FAILED) it took navigation and
//               data fetches with it -- clicks did nothing, new tabs would not
//               load.
//
// So the channel count is now decoupled from the connection count: the pool
// opens ONE EventSource for the union of subscribed channels and fans events
// out by the channel each one names. Twenty widgets or two, a tab holds one
// stream. See app/api/live/route.ts for the wire format and
// thoughts/shared/handoffs/2026-06-11_deploy-postmortem.md for the earlier
// "clicks do nothing" checklist.

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

/** A frame as it arrives on the wire; mirrors LiveFrame in lib/live.ts. */
interface LiveFrame {
  c?: string;
  e?: LiveEvent | null;
  i?: string;
}

const subscribers = new Map<string, Set<LiveSubscriber>>();

let connection: EventSource | null = null;
/** Channels the open connection was opened for, in the order sent. */
let connectedTo = "";
let syncScheduled = false;

// The server replays a channel's recent history to every new connection, so
// re-opening the stream to add one widget's channel would show the activity
// feed events a second time. Ids are compared for equality only -- see the
// bootId note in lib/live.ts.
const SEEN_MAX = 64;
const seen = new Map<string, { ids: Set<string>; order: string[] }>();

function alreadySeen(channel: string, id: string): boolean {
  let entry = seen.get(channel);
  if (!entry) {
    entry = { ids: new Set(), order: [] };
    seen.set(channel, entry);
  }
  if (entry.ids.has(id)) return true;
  entry.ids.add(id);
  entry.order.push(id);
  if (entry.order.length > SEEN_MAX) {
    const dropped = entry.order.shift()!;
    entry.ids.delete(dropped);
  }
  return false;
}

function deliver(channel: string, evt: LiveEvent | null): void {
  const subs = subscribers.get(channel);
  if (!subs) return;
  // Iterating the live Set is deliberate: a subscriber that unsubscribes a
  // peer mid-event should stop that peer from being called for this event
  // too. Set iteration already tolerates deleting the current element, so
  // unsubscribing yourself from your own callback is safe.
  for (const fn of subs) fn(evt);
}

function onMessage(e: MessageEvent<string>): void {
  let frame: LiveFrame;
  try {
    frame = JSON.parse(e.data) as LiveFrame;
  } catch {
    // Unroutable: without a channel there is no subscriber to hand it to.
    return;
  }
  const channel = frame.c;
  if (typeof channel !== "string") return;
  if (frame.i !== undefined && alreadySeen(channel, frame.i)) return;
  const event = frame.e;
  deliver(channel, event && typeof event === "object" ? event : null);
}

/**
 * Open, re-open or close the single connection so it matches the channels
 * currently subscribed. Called on a microtask so a page that mounts twenty
 * widgets in one render connects once, not twenty times.
 */
function sync(): void {
  syncScheduled = false;
  const wanted = [...subscribers.keys()].sort();
  const key = wanted.join(",");
  if (key === connectedTo) return;

  connection?.close();
  connection = null;
  connectedTo = key;

  if (wanted.length === 0) return;
  connection = new EventSource(`/api/live?channels=${encodeURIComponent(key)}`);
  connection.onmessage = onMessage;
}

function scheduleSync(): void {
  if (syncScheduled) return;
  syncScheduled = true;
  queueMicrotask(sync);
}

/**
 * Subscribe to a live channel. Returns an unsubscribe function; the channel
 * leaves the connection once its last subscriber is gone, and the connection
 * itself closes once no channel is left.
 *
 * Events are delivered unfiltered -- filtering "watching" or "update" is each
 * caller's job, because the pool cannot know which of them a given consumer
 * cares about.
 */
export function subscribeRaw(channel: string, onEvent: LiveSubscriber): () => void {
  // Server-render and any non-browser environment: nothing to connect to.
  if (typeof EventSource === "undefined") return () => {};

  let subs = subscribers.get(channel);
  if (!subs) {
    subs = new Set();
    subscribers.set(channel, subs);
  }
  subs.add(onEvent);
  scheduleSync();

  let unsubscribed = false;
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
    const current = subscribers.get(channel);
    if (!current) return;
    current.delete(onEvent);
    if (current.size === 0) {
      subscribers.delete(channel);
      seen.delete(channel);
    }
    scheduleSync();
  };
}

/** How many channels currently have at least one subscriber. Diagnostic use. */
export function openChannelCount(): number {
  return subscribers.size;
}

/** How many network connections the tab holds. One, or none. Diagnostic use. */
export function openConnectionCount(): number {
  return connection ? 1 : 0;
}
