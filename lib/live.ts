type SSEController = ReadableStreamDefaultController<Uint8Array>;

export interface LiveEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * One entry per (connection, channel). `muxed` records which wire format that
 * connection asked for: a multiplexed connection carries many channels down one
 * stream, so every event has to say which channel it belongs to. A legacy
 * one-channel-per-connection client already knows, and gets the bare event.
 */
interface Sub {
  ctrl: SSEController;
  muxed: boolean;
}

/** A multiplexed frame. Kept short because it prefixes every event on the wire. */
export interface LiveFrame {
  /** Channel the event was broadcast on. */
  c: string;
  /** The event itself. */
  e: LiveEvent;
  /** Set only on events that are also kept in history; see broadcast(). */
  i?: string;
}

const channels = new Map<string, Set<Sub>>();
const encoder = new TextEncoder();

// On SIGTERM (deploys), close every active SSE controller so the Node
// event loop can drain and the process exits in ~1s instead of waiting
// for systemd's 10s force-kill. Without this, every deploy left a window
// where Apache returned 503s and visitors' tabs froze on broken chunks.
// Guarded with a module-level flag so the listener installs once even if
// the file is HMR-evaluated multiple times during dev.
declare global {
  // eslint-disable-next-line no-var
  var __sseShutdownInstalled: boolean | undefined;
}
if (typeof process !== "undefined" && !globalThis.__sseShutdownInstalled) {
  globalThis.__sseShutdownInstalled = true;
  const closeAll = (): void => {
    for (const subs of channels.values()) {
      for (const sub of [...subs]) {
        try { sub.ctrl.close(); } catch { /* already closed */ }
      }
      subs.clear();
    }
    channels.clear();
  };
  process.on("SIGTERM", closeAll);
  process.on("SIGINT", closeAll);
}

export function subscribe(channel: string, ctrl: SSEController, muxed = false): () => void {
  if (!channels.has(channel)) channels.set(channel, new Set());
  const sub: Sub = { ctrl, muxed };
  channels.get(channel)!.add(sub);
  return () => {
    const subs = channels.get(channel);
    if (!subs) return;
    subs.delete(sub);
    if (subs.size === 0) channels.delete(channel);
  };
}

export function subscriberCount(channel: string): number {
  return channels.get(channel)?.size ?? 0;
}

// Recent-event history for channels that need backfill on (re)connect. Without
// it, an event broadcast while a feed is briefly disconnected (e.g. the SSE drops
// during a page navigation and reconnects a moment later) is lost forever — the
// reason a user's own colly view never appeared in the live feed. Kept tiny and
// in-memory (single server process).
const HISTORY_CHANNELS = new Set(["site:activity"]);
const HISTORY_MAX = 20;
const history = new Map<string, HistoryEntry[]>();

export interface HistoryEntry {
  id: string;
  event: LiveEvent;
}

// A multiplexed client reconnects with its whole channel set at once -- adding
// one widget's channel re-opens the stream -- so it receives the backfill again
// and has to recognise what it already showed. Ids are prefixed with a per-boot
// value so that after a restart (which also empties history) the fresh ids never
// collide with what a still-open tab remembers, and its events are not dropped
// as duplicates. Clients compare ids for equality only, never for order.
const bootId = Math.random().toString(36).slice(2, 10);
let eventSeq = 0;

export function getHistory(channel: string): HistoryEntry[] {
  return history.get(channel) ?? [];
}

export function frame(channel: string, event: LiveEvent, id?: string): LiveFrame {
  return id === undefined ? { c: channel, e: event } : { c: channel, e: event, i: id };
}

export function broadcast(channel: string, event: LiveEvent): void {
  // Record to history BEFORE the no-subscribers early return, so events that
  // happen during a connection gap are still delivered to the next subscriber.
  let id: string | undefined;
  if (HISTORY_CHANNELS.has(channel) && event.type !== "watching") {
    id = `${bootId}-${++eventSeq}`;
    const h = history.get(channel) ?? [];
    h.push({ id, event });
    if (h.length > HISTORY_MAX) h.shift();
    history.set(channel, h);
  }
  const subs = channels.get(channel);
  if (!subs || subs.size === 0) return;
  // Both encodings are built at most once per broadcast, however many
  // connections are listening.
  let bare: Uint8Array | undefined;
  let muxed: Uint8Array | undefined;
  for (const sub of [...subs]) {
    const payload = sub.muxed
      ? (muxed ??= encoder.encode(`data: ${JSON.stringify(frame(channel, event, id))}\n\n`))
      : (bare ??= encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    try {
      sub.ctrl.enqueue(payload);
    } catch {
      subs.delete(sub);
    }
  }
}
