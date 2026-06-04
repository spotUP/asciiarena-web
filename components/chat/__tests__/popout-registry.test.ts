import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The registry is client-only: it reads window.localStorage and BroadcastChannel.
// vitest runs in a node environment, so we install minimal in-memory fakes on
// globalThis before importing the module under test.

interface GlobalWithWindow {
  window?: unknown;
  localStorage?: unknown;
  BroadcastChannel?: unknown;
}

// A shared bus so multiple BroadcastChannel instances (simulating two browser
// windows) deliver messages to each other, like real same-origin channels.
const buses = new Map<string, Set<FakeBroadcastChannel>>();

class FakeBroadcastChannel {
  name: string;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  constructor(name: string) {
    this.name = name;
    let set = buses.get(name);
    if (!set) { set = new Set(); buses.set(name, set); }
    set.add(this);
  }
  postMessage(data: unknown): void {
    const peers = buses.get(this.name);
    if (!peers) return;
    for (const ch of peers) {
      if (ch === this) continue; // real channels don't echo to the sender
      ch.onmessage?.({ data });
    }
  }
  close(): void {
    buses.get(this.name)?.delete(this);
  }
}

function installFakeEnv(): { store: Map<string, string> } {
  const store = new Map<string, string>();
  const listeners = new Set<(e: { key: string | null }) => void>();
  const fakeWindow = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
        // Mirror real `storage` events to OTHER windows (here: same listeners).
        for (const l of listeners) l({ key: k });
      },
      removeItem: (k: string) => { store.delete(k); for (const l of listeners) l({ key: k }); },
    },
    addEventListener: (type: string, cb: (e: { key: string | null }) => void) => {
      if (type === "storage") listeners.add(cb);
    },
    removeEventListener: (type: string, cb: (e: { key: string | null }) => void) => {
      if (type === "storage") listeners.delete(cb);
    },
  };
  const g = globalThis as unknown as GlobalWithWindow;
  g.window = fakeWindow;
  g.localStorage = fakeWindow.localStorage;
  g.BroadcastChannel = FakeBroadcastChannel as unknown;
  return { store };
}

function clearFakeEnv(): void {
  const g = globalThis as unknown as GlobalWithWindow;
  delete g.window;
  delete g.localStorage;
  delete g.BroadcastChannel;
  buses.clear();
}

describe("popoutRegistry", () => {
  beforeEach(() => {
    installFakeEnv();
    vi.resetModules();
  });
  afterEach(() => {
    clearFakeEnv();
    vi.useRealTimers();
  });

  it("announcePopoutOpen adds the peer to the popped-out set; close removes it", async () => {
    const reg = await import("../popoutRegistry");
    expect(reg.getPoppedOutPeers().has("42")).toBe(false);

    reg.announcePopoutOpen(42);
    expect(reg.getPoppedOutPeers().has("42")).toBe(true);
    expect(reg.isPoppedOut(42)).toBe(true);

    reg.announcePopoutClose(42);
    expect(reg.getPoppedOutPeers().has("42")).toBe(false);
    expect(reg.isPoppedOut(42)).toBe(false);
  });

  it("normalises numeric and string peer ids to the same entry", async () => {
    const reg = await import("../popoutRegistry");
    reg.announcePopoutOpen("7");
    expect(reg.isPoppedOut(7)).toBe(true);
    reg.announcePopoutClose(7);
    expect(reg.isPoppedOut("7")).toBe(false);
  });

  it("prunes stale entries (a crashed popout never fired its close)", async () => {
    vi.useFakeTimers();
    const reg = await import("../popoutRegistry");
    reg.announcePopoutOpen(99);
    expect(reg.isPoppedOut(99)).toBe(true);

    // Advance past the stale window without a heartbeat refresh.
    vi.advanceTimersByTime(reg.STALE_MS + 1);
    expect(reg.getPoppedOutPeers().has("99")).toBe(false);
  });

  it("notifies onChange subscribers when a popout opens and closes", async () => {
    const reg = await import("../popoutRegistry");
    let calls = 0;
    const unsub = reg.onChange(() => { calls += 1; });
    reg.announcePopoutOpen(5);
    reg.announcePopoutClose(5);
    expect(calls).toBeGreaterThanOrEqual(2);
    unsub();
    const afterUnsub = calls;
    reg.announcePopoutOpen(5);
    expect(calls).toBe(afterUnsub); // no further notifications after unsubscribe
  });

  it("propagates an open across windows via BroadcastChannel (storage shared)", async () => {
    // Two imports share the same localStorage-backed map, and the fake
    // BroadcastChannel bus delivers the open notification to the listener.
    const reg = await import("../popoutRegistry");
    let notified = false;
    reg.onChange(() => { notified = true; });

    // Simulate the "other window" by posting directly on a sibling channel.
    const other = new FakeBroadcastChannel("asciiarena:chat:popout");
    other.postMessage({ kind: "open", peerId: "13", ts: Date.now() });

    expect(notified).toBe(true);
    expect(reg.getPoppedOutPeers().has("13")).toBe(true);
  });
});
