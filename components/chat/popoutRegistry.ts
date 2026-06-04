import { useSyncExternalStore } from "react";

// Cross-window coordination for popped-out chats.
//
// When a DM is "popped out" (opened in a separate OS window via window.open),
// the main page must stop rendering / re-opening the DOCKED window for that
// same peer. Otherwise:
//   * the docked window reappears (the user-channel message listener un-minimizes
//     or re-creates it), and
//   * its duplicate `thread:${tid}` SSE subscriptions pile up on top of the
//     popout's, exhausting the browser/proxy concurrent-SSE budget and starving
//     the popout's own message stream.
//
// The popout lives in a SEPARATE browser context, so the two windows share state
// via a BroadcastChannel (instant, same-origin) AND a localStorage key (so a
// freshly-loaded main page also learns which peers are already popped out, and
// so the BroadcastChannel-less fallback path still works).
//
// Entries carry a timestamp and are treated as stale after STALE_MS without a
// refresh, so a crashed popout (which never fired its close announcement) can't
// suppress the docked window forever. The popout refreshes its entry on a
// heartbeat; the main page prunes stale entries whenever it reads the set.

const CHANNEL_NAME = "asciiarena:chat:popout";
const STORAGE_KEY = "asciiarena:chat:popout";

// A popout entry is considered stale if it hasn't been refreshed within this
// window. The popout heartbeat (below) must be comfortably shorter than this.
export const STALE_MS = 15_000;
export const HEARTBEAT_MS = 5_000;

type PopoutMap = Record<string, number>; // peerId (string) -> last-seen epoch ms

type Listener = () => void;

interface BroadcastMessage {
  kind: "open" | "close" | "ping";
  peerId: string;
  ts: number;
}

const listeners = new Set<Listener>();

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function readMap(): PopoutMap {
  if (!hasWindow()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") return parsed as PopoutMap;
    return {};
  } catch {
    return {};
  }
}

function writeMap(map: PopoutMap): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / disabled storage */
  }
}

/** Drop entries older than STALE_MS. Returns the pruned map (and persists it if it changed). */
function prune(map: PopoutMap): PopoutMap {
  const now = Date.now();
  let changed = false;
  const out: PopoutMap = {};
  for (const [peer, ts] of Object.entries(map)) {
    if (typeof ts === "number" && now - ts < STALE_MS) {
      out[peer] = ts;
    } else {
      changed = true;
    }
  }
  if (changed) writeMap(out);
  return out;
}

function notify(): void {
  for (const l of listeners) {
    try { l(); } catch { /* a bad listener shouldn't break the rest */ }
  }
}

// --- BroadcastChannel plumbing (lazy, client-only) -------------------------

let channel: BroadcastChannel | null = null;
let channelInit = false;

function getChannel(): BroadcastChannel | null {
  if (channelInit) return channel;
  channelInit = true;
  if (!hasWindow() || typeof BroadcastChannel === "undefined") {
    channel = null;
    return null;
  }
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev: MessageEvent<BroadcastMessage>) => {
      const data = ev.data;
      if (!data || typeof data.peerId !== "string") return;
      // Mirror the broadcast into our localStorage view, then notify React.
      const map = readMap();
      if (data.kind === "close") {
        if (map[data.peerId] != null) { delete map[data.peerId]; writeMap(map); }
      } else {
        map[data.peerId] = typeof data.ts === "number" ? data.ts : Date.now();
        writeMap(map);
      }
      notify();
    };
  } catch {
    channel = null;
  }
  return channel;
}

function post(kind: BroadcastMessage["kind"], peerId: string, ts: number): void {
  const ch = getChannel();
  if (!ch) return;
  try { ch.postMessage({ kind, peerId, ts } satisfies BroadcastMessage); } catch { /* channel closed */ }
}

// localStorage `storage` events fire in OTHER documents of the same origin when
// a key changes — this is the cross-window fallback when BroadcastChannel is
// unavailable, and a belt-and-braces signal even when it isn't.
let storageBound = false;
function bindStorage(): void {
  if (storageBound || !hasWindow()) return;
  storageBound = true;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) notify();
  });
}

// --- Public API ------------------------------------------------------------

/** Announce that the given peer is now popped out (open or heartbeat refresh). */
export function announcePopoutOpen(peerId: number | string): void {
  if (!hasWindow()) return;
  const id = String(peerId);
  const ts = Date.now();
  const map = readMap();
  map[id] = ts;
  writeMap(map);
  post("open", id, ts);
  notify();
}

/** Announce that the given peer's popout has closed. */
export function announcePopoutClose(peerId: number | string): void {
  if (!hasWindow()) return;
  const id = String(peerId);
  const map = readMap();
  if (map[id] != null) { delete map[id]; writeMap(map); }
  post("close", id, Date.now());
  notify();
}

/** The set of peer ids (as strings) currently popped out, with stale entries pruned. */
export function getPoppedOutPeers(): Set<string> {
  return new Set(Object.keys(prune(readMap())));
}

/** True if this specific peer is currently popped out. */
export function isPoppedOut(peerId: number | string): boolean {
  const map = prune(readMap());
  return map[String(peerId)] != null;
}

/**
 * Subscribe to registry changes (open/close/heartbeat from any window).
 * Returns an unsubscribe fn. Binds the cross-window listeners lazily on first
 * subscriber. Safe to call during SSR (no-op unsubscribe).
 */
export function onChange(listener: Listener): () => void {
  if (!hasWindow()) return () => {};
  getChannel();   // ensure the BroadcastChannel is listening
  bindStorage();  // ensure the storage fallback is listening
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// --- React binding ----------------------------------------------------------

// A stable snapshot string so useSyncExternalStore can cheaply detect changes
// (returning a fresh Set each render would loop forever). The set is derived
// from this string by the hook below.
let snapshotCache = "";
let snapshotSet: Set<string> = new Set();

function getSnapshot(): string {
  const peers = [...getPoppedOutPeers()].sort();
  const key = peers.join(",");
  if (key !== snapshotCache) {
    snapshotCache = key;
    snapshotSet = new Set(peers);
  }
  return snapshotCache;
}

function getServerSnapshot(): string {
  return "";
}

/**
 * React hook: the live set of popped-out peer ids (as strings). Re-renders the
 * caller whenever a popout opens/closes in any window. SSR-safe (empty set).
 */
export function usePoppedOutPeers(): Set<string> {
  useSyncExternalStore(onChange, getSnapshot, getServerSnapshot);
  return snapshotSet;
}

// --- Test-only reset --------------------------------------------------------

/** Reset module state. Intended for tests only. */
export function __resetForTest(): void {
  listeners.clear();
  if (channel) { try { channel.close(); } catch { /* ignore */ } }
  channel = null;
  channelInit = false;
  storageBound = false;
}
