// Per-peer "auto-expand snooze" for chat, persisted in localStorage so it
// survives page reloads (the in-memory chat window list does not). After you
// minimize a peer's chat, new messages from them stay collapsed for a while
// instead of popping the window open again.

const KEY = "aa.chat.snooze";

type SnoozeMap = Record<string, number>; // peerId -> minimized-at epoch ms

function read(): SnoozeMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as SnoozeMap;
  } catch {
    return {};
  }
}

function write(map: SnoozeMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota / disabled storage — snooze just won't persist */
  }
}

/** Start (or refresh) the snooze for a peer, stamped now. */
export function setSnooze(peerId: number): void {
  const m = read();
  m[String(peerId)] = Date.now();
  write(m);
}

/** End the snooze for a peer (they opened/read the chat). */
export function clearSnooze(peerId: number): void {
  const m = read();
  if (m[String(peerId)] != null) {
    delete m[String(peerId)];
    write(m);
  }
}

/**
 * True if the peer is still within their snooze window. Expired entries are
 * cleaned up as a side effect so the map doesn't grow unbounded.
 */
export function isSnoozed(peerId: number, windowMs: number): boolean {
  const ts = read()[String(peerId)];
  if (ts == null) return false;
  if (Date.now() - ts >= windowMs) {
    clearSnooze(peerId);
    return false;
  }
  return true;
}
