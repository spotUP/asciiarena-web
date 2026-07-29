import { describe, it, expect, vi } from "vitest";
import { createStaleWhileErrorCache } from "../staleWhileErrorCache";

/**
 * The scenewall widgets sat behind unstable_cache, which offers two options and
 * neither is what a third-party widget wants:
 *
 *   - return null on failure, and the failure gets cached, pinning the widget
 *     empty for the whole revalidate window;
 *   - throw on failure, and there is nothing to show, so the widget blanks on a
 *     blip -- while Next logs the thrown value plus the minified source of the
 *     fetcher, which is what filled the journal with 27-line DOMException dumps
 *     several times a minute.
 *
 * What it needs is "keep showing the last good value while the far end is
 * down", with a ceiling so a widget headed "weektop" never quietly shows last
 * month.
 */

function harness(policy = { ttlMs: 1000, maxStaleMs: 5000 }) {
  let clock = 0;
  const fetch = vi.fn<(key: string) => Promise<string>>();
  const onFailure = vi.fn();
  const cache = createStaleWhileErrorCache<string>(
    { now: () => clock, fetch, onFailure },
    policy,
  );
  return { cache, fetch, onFailure, tick: (ms: number) => { clock += ms; }, at: () => clock };
}

describe("createStaleWhileErrorCache", () => {
  it("fetches once and serves the cached value inside the TTL", async () => {
    const h = harness();
    h.fetch.mockResolvedValue("fresh");
    expect(await h.cache.get("k")).toBe("fresh");
    h.tick(999);
    expect(await h.cache.get("k")).toBe("fresh");
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL has passed", async () => {
    const h = harness();
    h.fetch.mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    await h.cache.get("k");
    h.tick(1000);
    expect(await h.cache.get("k")).toBe("second");
    expect(h.fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps serving the last good value when the upstream fails", async () => {
    // The whole point: a 30s timeout must not blank a populated widget.
    const h = harness();
    h.fetch.mockResolvedValueOnce("good");
    await h.cache.get("k");
    h.tick(1500);
    h.fetch.mockRejectedValueOnce(new Error("no response within 30s"));
    expect(await h.cache.get("k")).toBe("good");
  });

  it("stops serving stale data once it is older than maxStaleMs", async () => {
    const h = harness();
    h.fetch.mockResolvedValueOnce("ancient");
    await h.cache.get("k");
    h.tick(5001);
    h.fetch.mockRejectedValueOnce(new Error("still down"));
    expect(await h.cache.get("k")).toBeNull();
  });

  it("reports null when it fails with nothing cached", async () => {
    // A cold start against a dead upstream. The route turns null into a null
    // body and the client retries; see lib/scenewallRetry.ts.
    const h = harness();
    h.fetch.mockRejectedValueOnce(new Error("cold and down"));
    expect(await h.cache.get("k")).toBeNull();
  });

  it("never rejects, whatever the fetcher throws", async () => {
    const h = harness();
    h.fetch.mockRejectedValueOnce("not even an Error");
    await expect(h.cache.get("k")).resolves.toBeNull();
  });

  it("does not cache a failure as if it were a value", async () => {
    // The unstable_cache trap: one failed fetch must not pin the widget empty.
    const h = harness();
    h.fetch.mockRejectedValueOnce(new Error("blip"));
    expect(await h.cache.get("k")).toBeNull();
    h.fetch.mockResolvedValueOnce("recovered");
    expect(await h.cache.get("k")).toBe("recovered");
  });

  it("collapses simultaneous misses into one upstream request", async () => {
    // N concurrent misses must not become N requests to an upstream already too
    // slow to keep up.
    const h = harness();
    let release: (v: string) => void = () => {};
    h.fetch.mockImplementation(() => new Promise<string>(r => { release = r; }));
    const all = Promise.all([h.cache.get("k"), h.cache.get("k"), h.cache.get("k")]);
    release("once");
    expect(await all).toEqual(["once", "once", "once"]);
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries after a failed in-flight fetch rather than reusing it", async () => {
    const h = harness();
    h.fetch.mockRejectedValueOnce(new Error("down"));
    expect(await h.cache.get("k")).toBeNull();
    h.fetch.mockResolvedValueOnce("up");
    expect(await h.cache.get("k")).toBe("up");
    expect(h.fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps keys independent", async () => {
    const h = harness();
    h.fetch.mockImplementation(async (key: string) => `value-for-${key}`);
    expect(await h.cache.get("a")).toBe("value-for-a");
    expect(await h.cache.get("b")).toBe("value-for-b");
  });

  it("reports each failure exactly once, for the log", async () => {
    const h = harness();
    h.fetch.mockRejectedValueOnce(new Error("down"));
    await h.cache.get("k");
    expect(h.onFailure).toHaveBeenCalledTimes(1);
    expect(h.onFailure.mock.calls[0][0]).toBe("k");
  });
});
