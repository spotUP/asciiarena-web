import { describe, it, expect, beforeEach, vi } from "vitest";

// The pool keeps its connections in module scope, so each test re-imports the
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

  emit(data: string) {
    this.onmessage?.({ data } as MessageEvent<string>);
  }
}

async function freshPool() {
  vi.resetModules();
  FakeEventSource.instances = [];
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  return import("@/lib/sse-pool");
}

describe("live channel connections", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
  });

  it("two components watching the same channel open one connection, not two", async () => {
    const { subscribeRaw } = await freshPool();

    subscribeRaw("site:forum", () => {});
    subscribeRaw("site:forum", () => {});

    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("two components watching different channels open one connection each", async () => {
    const { subscribeRaw, openChannelCount } = await freshPool();

    subscribeRaw("site:forum", () => {});
    subscribeRaw("site:online", () => {});

    expect(FakeEventSource.instances).toHaveLength(2);
    expect(openChannelCount()).toBe(2);
  });

  it("every subscriber on a channel receives the same event", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    subscribeRaw("site:forum", () => seen.push("a"));
    subscribeRaw("site:forum", () => seen.push("b"));
    FakeEventSource.instances[0].emit(JSON.stringify({ type: "post" }));

    expect(seen).toEqual(["a", "b"]);
  });

  it("the event payload arrives parsed, not as a raw string", async () => {
    const { subscribeRaw } = await freshPool();
    let received: unknown = "untouched";

    subscribeRaw("forum:topic:7", (evt) => {
      received = evt;
    });
    FakeEventSource.instances[0].emit(JSON.stringify({ type: "posted", nick: "spot" }));

    expect(received).toEqual({ type: "posted", nick: "spot" });
  });

  it("an unparseable event reaches subscribers as null instead of being swallowed", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: unknown[] = [];

    subscribeRaw("site:forum", (evt) => seen.push(evt));
    FakeEventSource.instances[0].emit("not json at all");

    expect(seen).toEqual([null]);
  });

  it("a channel with one subscriber left stays connected", async () => {
    const { subscribeRaw, openChannelCount } = await freshPool();

    const unsubA = subscribeRaw("site:forum", () => {});
    subscribeRaw("site:forum", () => {});
    unsubA();

    expect(FakeEventSource.instances[0].closed).toBe(false);
    expect(openChannelCount()).toBe(1);
  });

  it("the connection closes once the last subscriber unmounts", async () => {
    const { subscribeRaw, openChannelCount } = await freshPool();

    const unsubA = subscribeRaw("site:forum", () => {});
    const unsubB = subscribeRaw("site:forum", () => {});
    unsubA();
    unsubB();

    expect(FakeEventSource.instances[0].closed).toBe(true);
    expect(openChannelCount()).toBe(0);
  });

  it("unsubscribing twice does not close a connection someone else reopened", async () => {
    const { subscribeRaw } = await freshPool();

    const unsubA = subscribeRaw("site:forum", () => {});
    unsubA();
    unsubA();
    subscribeRaw("site:forum", () => {});

    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1].closed).toBe(false);
  });

  it("an unmounted component stops receiving events while its peers keep going", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    const unsubA = subscribeRaw("site:forum", () => seen.push("a"));
    subscribeRaw("site:forum", () => seen.push("b"));
    FakeEventSource.instances[0].emit(JSON.stringify({ type: "post" }));
    unsubA();
    FakeEventSource.instances[0].emit(JSON.stringify({ type: "post" }));

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
    FakeEventSource.instances[0].emit(JSON.stringify({ type: "post" }));

    expect(seen).toEqual(["a", "b"]);
  });

  it("subscribing after the channel went quiet opens a fresh connection", async () => {
    const { subscribeRaw } = await freshPool();
    const seen: string[] = [];

    const unsub = subscribeRaw("site:forum", () => seen.push("first"));
    unsub();
    subscribeRaw("site:forum", () => seen.push("second"));
    FakeEventSource.instances[1].emit(JSON.stringify({ type: "post" }));

    expect(FakeEventSource.instances).toHaveLength(2);
    expect(seen).toEqual(["second"]);
  });

  it("the channel name is url-encoded so a colon-separated channel reaches the right stream", async () => {
    const { subscribeRaw } = await freshPool();

    subscribeRaw("forum:topic:412", () => {});

    expect(FakeEventSource.instances[0].url).toBe("/api/live?channel=forum%3Atopic%3A412");
  });
});
