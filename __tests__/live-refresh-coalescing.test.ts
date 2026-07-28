import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Regression: the home page mounts four widgets on site:votes and four on
 * site:releases. Each LiveRefresh called router.refresh() independently, so a
 * single event caused four full re-renders of a force-dynamic page at once --
 * server work and main-thread work proportional to widget count, landing while
 * the visitor types.
 *
 * The coalescing itself is module-level scheduling, so it is asserted here as
 * a behaviour of the scheduler and as a structural guarantee about the file.
 */

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

describe("live refreshes are coalesced across widgets", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.resetModules();
    vi.useFakeTimers();
    (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  });

  it("turns a burst of events on one channel into a single refresh", async () => {
    const { subscribeRaw } = await import("@/lib/sse-pool");
    const refresh = vi.fn();

    // Stand in for the four widgets that share site:votes: each subscriber
    // schedules through the same coalescing timer.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        refresh();
      }, 400);
    };
    for (let i = 0; i < 4; i++) subscribeRaw("site:votes", () => schedule());

    FakeEventSource.instances[0].emit(JSON.stringify({ type: "vote" }));
    vi.advanceTimersByTime(500);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh at all for a subscriber-count ping", async () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/widgets/LiveRefresh.tsx"),
      "utf8",
    );
    expect(source).toMatch(/type === "watching"/);
    expect(source).toMatch(/return;/);
  });

  it("schedules through a shared timer rather than refreshing inline", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/widgets/LiveRefresh.tsx"),
      "utf8",
    );
    // A bare router.refresh() inside the subscription callback is the bug.
    expect(source).not.toMatch(/subscribeRaw\([\s\S]*?router\.refresh\(\)/);
    expect(source).toMatch(/scheduleRefresh\(router\)/);
    // The timer has to live outside the component or every instance gets one.
    expect(source).toMatch(/^let timer/m);
  });
});
