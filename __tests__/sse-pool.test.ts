import { describe, it, expect, beforeEach, vi } from "vitest";

// The pool keeps its connection in module scope, so each test re-imports the
// module to get a clean slate.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onmessage: ((e: MessageEvent<string>) => void) | null = null;
  closed = false;

  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  /** Deliver one multiplexed frame, as app/api/live/route.ts writes it. */
  emit(channel: string, event: unknown, id?: string) {
    const frame = id === undefined ? { c: channel, e: event } : { c: channel, e: event, i: id };
    this.onmessage?.({ data: JSON.stringify(frame) } as MessageEvent<string>);
  }

  emitRaw(data: string) {
    this.onmessage?.({ data } as MessageEvent<string>);
  }
}

/** The pool opens/closes on a microtask so one render batches into one connect. */
const flush = () => Promise.resolve().then(() => {});

async function freshPool() {
  vi.resetModules();
  FakeEventSource.instances = [];
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  return import("@/lib/sse-pool");
}

/** The live connection currently open, i.e. the one events arrive on. */
function live() {
  const open = FakeEventSource.instances.filter(i => !i.closed);
  return open[open.length - 1];
}

describe("live channel connections", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
  });

  it("twenty channels on a page open one connection, not twenty", async () => {
    const { subscribeRaw, openChannelCount, openConnectionCount } = await freshPool();

    for (let i = 0; i < 20; i++) subscribeRaw(`site:channel-${i}`, () => {});
    await flush();

    expect(openChannelCount()).toBe(20);
    expect(openConnectionCount()).toBe(1);
    expect(FakeEventSource.instances.filter(i => !i.closed)).toHaveLength(1);
  });

  it("two components watching the same channel open one connection, not two", async () => {
    const { subscribeRaw } = await freshPool();

    subscribeRaw("site:forum", () => {});
    subscribeRaw("site:forum", () => {});
    await flush();

    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("adding a second channel keeps a single connection open", async () => {
    const { subscribeRaw, openConnectionCount } = await freshPool();

    subscribeRaw("site:forum", () => {});
    await flush();
    subscribeRaw("site:online", () => {});
    await flush();

    expect(openConnectionCount()).toBe(1);
    expect(FakeEventSource.instances.filter(i => !i.closed)).toHaveLength(1);
  });

  it("the connection asks for every subscribed channel in one request", async () => {
    const { subscribeRaw } = await freshPool();

    subscribeRaw("forum:topic:412", () => {});
    subscribeRaw("site:online", () => {});
    await flush();

    expect(live().url).toBe("/api/live?channels=forum%3Atopic%3A412%2Csite%3Aonline");
  });

  it("an event reaches only the subscribers of the channel it names", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    subscribeRaw("site:forum", () => seen.push("forum"));
    subscribeRaw("site:online", () => seen.push("online"));
    await flush();
    live().emit("site:online", { type: "join" });

    expect(seen).toEqual(["online"]);
  });

  it("every subscriber on a channel receives the same event", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    subscribeRaw("site:forum", () => seen.push("a"));
    subscribeRaw("site:forum", () => seen.push("b"));
    await flush();
    live().emit("site:forum", { type: "post" });

    expect(seen).toEqual(["a", "b"]);
  });

  it("the event payload arrives parsed, not as a raw string", async () => {
    const { subscribeRaw } = await freshPool();
    let received: unknown = "untouched";

    subscribeRaw("forum:topic:7", (evt) => {
      received = evt;
    });
    await flush();
    live().emit("forum:topic:7", { type: "posted", nick: "spot" });

    expect(received).toEqual({ type: "posted", nick: "spot" });
  });

  it("an unreadable event reaches its channel as null instead of being swallowed", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: unknown[] = [];

    subscribeRaw("site:forum", (evt) => seen.push(evt));
    await flush();
    live().emit("site:forum", "not an object");

    expect(seen).toEqual([null]);
  });

  it("a frame with no channel to route by disturbs nobody", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: unknown[] = [];

    subscribeRaw("site:forum", (evt) => seen.push(evt));
    await flush();
    live().emitRaw("not json at all");

    expect(seen).toEqual([]);
  });

  it("a history event replayed after a reconnect is not shown twice", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: unknown[] = [];

    subscribeRaw("site:activity", (evt) => seen.push(evt));
    await flush();
    live().emit("site:activity", { type: "view", nick: "spot" }, "b00t-7");

    // A second widget mounts: the connection re-opens with both channels and
    // the server backfills site:activity history onto it again.
    subscribeRaw("site:online", () => {});
    await flush();
    live().emit("site:activity", { type: "view", nick: "spot" }, "b00t-7");

    expect(seen).toEqual([{ type: "view", nick: "spot" }]);
  });

  it("a restarted server's history is delivered, not mistaken for a duplicate", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: unknown[] = [];

    subscribeRaw("site:activity", (evt) => seen.push(evt));
    await flush();
    live().emit("site:activity", { type: "view", nick: "spot" }, "b00t-7");
    live().emit("site:activity", { type: "view", nick: "dino" }, "fr3sh-1");

    expect(seen).toEqual([{ type: "view", nick: "spot" }, { type: "view", nick: "dino" }]);
  });

  it("events without an id are never deduplicated", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: unknown[] = [];

    subscribeRaw("site:online", (evt) => seen.push(evt));
    await flush();
    live().emit("site:online", { type: "watching", count: 2 });
    live().emit("site:online", { type: "watching", count: 2 });

    expect(seen).toHaveLength(2);
  });

  it("a channel with one subscriber left stays subscribed", async () => {
    const { subscribeRaw, openChannelCount, openConnectionCount } = await freshPool();

    const unsubA = subscribeRaw("site:forum", () => {});
    subscribeRaw("site:forum", () => {});
    await flush();
    unsubA();
    await flush();

    expect(openChannelCount()).toBe(1);
    expect(openConnectionCount()).toBe(1);
  });

  it("the connection closes once the last subscriber unmounts", async () => {
    const { subscribeRaw, openChannelCount, openConnectionCount } = await freshPool();

    const unsubA = subscribeRaw("site:forum", () => {});
    const unsubB = subscribeRaw("site:online", () => {});
    await flush();
    unsubA();
    unsubB();
    await flush();

    expect(openChannelCount()).toBe(0);
    expect(openConnectionCount()).toBe(0);
    expect(FakeEventSource.instances.every(i => i.closed)).toBe(true);
  });

  it("unsubscribing twice does not drop a channel someone else subscribed to", async () => {
    const { subscribeRaw, openChannelCount } = await freshPool();

    const unsubA = subscribeRaw("site:forum", () => {});
    await flush();
    unsubA();
    unsubA();
    subscribeRaw("site:forum", () => {});
    await flush();

    expect(openChannelCount()).toBe(1);
    expect(live().closed).toBe(false);
  });

  it("an unmounted component stops receiving events while its peers keep going", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    const unsubA = subscribeRaw("site:forum", () => seen.push("a"));
    subscribeRaw("site:forum", () => seen.push("b"));
    await flush();
    live().emit("site:forum", { type: "post" });
    unsubA();
    await flush();
    live().emit("site:forum", { type: "post" });

    expect(seen).toEqual(["a", "b", "b"]);
  });

  it("a component that unsubscribes while handling an event still sees that event through", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    const unsubA = subscribeRaw("site:forum", () => {
      seen.push("a");
      unsubA();
    });
    subscribeRaw("site:forum", () => seen.push("b"));
    await flush();
    live().emit("site:forum", { type: "post" });

    expect(seen).toEqual(["a", "b"]);
  });

  it("subscribing after the last channel went quiet opens a fresh connection", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    const unsub = subscribeRaw("site:forum", () => seen.push("first"));
    await flush();
    unsub();
    await flush();
    subscribeRaw("site:forum", () => seen.push("second"));
    await flush();
    live().emit("site:forum", { type: "post" });

    expect(FakeEventSource.instances).toHaveLength(2);
    expect(seen).toEqual(["second"]);
  });

  it("mounting and unmounting within one render settles on one connection", async () => {
    const { subscribeRaw, openConnectionCount } = await freshPool();

    const unsub = subscribeRaw("site:forum", () => {});
    subscribeRaw("site:online", () => {});
    unsub();
    await flush();

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(openConnectionCount()).toBe(1);
    expect(live().url).toBe("/api/live?channels=site%3Aonline");
  });
});
