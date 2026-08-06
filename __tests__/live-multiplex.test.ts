import { describe, it, expect, vi } from "vitest";

// lib/live.ts holds its channel table in module scope; re-import per test.
async function freshLive() {
  vi.resetModules();
  return import("@/lib/live");
}

const decoder = new TextDecoder();

/** Collects what a connection was sent, decoded back into events. */
function fakeConnection() {
  const frames: unknown[] = [];
  return {
    frames,
    ctrl: {
      enqueue(chunk: Uint8Array) {
        const text = decoder.decode(chunk);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) frames.push(JSON.parse(line.slice(6)));
        }
      },
      close() {},
    } as unknown as ReadableStreamDefaultController<Uint8Array>,
  };
}

describe("multiplexed live wire format", () => {
  it("a multiplexed connection is told which channel each event belongs to", async () => {
    const { subscribe, broadcast } = await freshLive();
    const conn = fakeConnection();

    subscribe("site:online", conn.ctrl, true);
    broadcast("site:online", { type: "join", nick: "spot" });

    expect(conn.frames).toEqual([{ c: "site:online", e: { type: "join", nick: "spot" } }]);
  });

  it("one connection carrying two channels can tell their events apart", async () => {
    const { subscribe, broadcast } = await freshLive();
    const conn = fakeConnection();

    subscribe("site:online", conn.ctrl, true);
    subscribe("site:comments", conn.ctrl, true);
    broadcast("site:comments", { type: "posted" });
    broadcast("site:online", { type: "join" });

    expect(conn.frames).toEqual([
      { c: "site:comments", e: { type: "posted" } },
      { c: "site:online", e: { type: "join" } },
    ]);
  });

  it("a tab still on the pre-deploy bundle keeps receiving bare events", async () => {
    const { subscribe, broadcast } = await freshLive();
    const conn = fakeConnection();

    subscribe("site:online", conn.ctrl);
    broadcast("site:online", { type: "join" });

    expect(conn.frames).toEqual([{ type: "join" }]);
  });

  it("both wire formats are served from a single broadcast", async () => {
    const { subscribe, broadcast } = await freshLive();
    const modern = fakeConnection();
    const legacy = fakeConnection();

    subscribe("site:online", modern.ctrl, true);
    subscribe("site:online", legacy.ctrl);
    broadcast("site:online", { type: "join" });

    expect(modern.frames).toEqual([{ c: "site:online", e: { type: "join" } }]);
    expect(legacy.frames).toEqual([{ type: "join" }]);
  });

  it("two connections on the same channel each count as one watcher", async () => {
    const { subscribe, subscriberCount } = await freshLive();
    const a = fakeConnection();
    const b = fakeConnection();

    subscribe("release:12:views", a.ctrl, true);
    const unsub = subscribe("release:12:views", b.ctrl, true);

    expect(subscriberCount("release:12:views")).toBe(2);
    unsub();
    expect(subscriberCount("release:12:views")).toBe(1);
  });

  it("unsubscribing one channel leaves the connection's other channels alone", async () => {
    const { subscribe, broadcast, subscriberCount } = await freshLive();
    const conn = fakeConnection();

    const unsubOnline = subscribe("site:online", conn.ctrl, true);
    subscribe("site:comments", conn.ctrl, true);
    unsubOnline();
    broadcast("site:online", { type: "join" });
    broadcast("site:comments", { type: "posted" });

    expect(subscriberCount("site:online")).toBe(0);
    expect(conn.frames).toEqual([{ c: "site:comments", e: { type: "posted" } }]);
  });

  it("a history event carries an id so a reconnecting tab can skip what it saw", async () => {
    const { subscribe, broadcast, getHistory } = await freshLive();
    const conn = fakeConnection();

    subscribe("site:activity", conn.ctrl, true);
    broadcast("site:activity", { type: "view", nick: "spot" });

    const [frame] = conn.frames as { i?: string }[];
    expect(typeof frame.i).toBe("string");
    expect(getHistory("site:activity")).toEqual([
      { id: frame.i, event: { type: "view", nick: "spot" } },
    ]);
  });

  it("the same event is never given the same id twice", async () => {
    const { broadcast, getHistory } = await freshLive();

    broadcast("site:activity", { type: "view", nick: "spot" });
    broadcast("site:activity", { type: "view", nick: "spot" });

    const ids = getHistory("site:activity").map(h => h.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("a channel without history sends no id, so nothing is deduplicated away", async () => {
    const { subscribe, broadcast } = await freshLive();
    const conn = fakeConnection();

    subscribe("site:online", conn.ctrl, true);
    broadcast("site:online", { type: "watching", count: 2 });
    broadcast("site:online", { type: "watching", count: 2 });

    expect(conn.frames).toEqual([
      { c: "site:online", e: { type: "watching", count: 2 } },
      { c: "site:online", e: { type: "watching", count: 2 } },
    ]);
  });
});
