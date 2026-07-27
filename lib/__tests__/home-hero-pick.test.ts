import { describe, it, expect } from "vitest";
import { pickRandomSubset, HERO_POOL_FACTOR } from "../home-hero-pick";

// Regression: RANDOM RELEASES showed the same two collys on every refresh,
// because the random pick itself sat inside a 240s unstable_cache. The pool is
// cached now; the draw happens per render.

const pool = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("pickRandomSubset", () => {
  it("returns a different draw when the rng advances (the refresh case)", () => {
    // Two deterministic rngs standing in for two separate page loads over the
    // same cached pool.
    const first = pickRandomSubset(pool, 2, seq([0.01, 0.01]));
    const second = pickRandomSubset(pool, 2, seq([0.99, 0.99]));
    expect(first).not.toEqual(second);
  });

  it("draws the requested number of distinct items", () => {
    const drawn = pickRandomSubset(pool, 3);
    expect(drawn).toHaveLength(3);
    expect(new Set(drawn).size).toBe(3);
    for (const item of drawn) expect(pool).toContain(item);
  });

  it("never mutates the cached pool", () => {
    const snapshot = [...pool];
    pickRandomSubset(pool, 4);
    expect(pool).toEqual(snapshot);
  });

  it("degrades to the whole pool when it is smaller than the request", () => {
    const drawn = pickRandomSubset(["a", "b"], 5);
    expect(drawn).toHaveLength(2);
    expect(new Set(drawn)).toEqual(new Set(["a", "b"]));
  });

  it("handles an empty pool and a zero count", () => {
    expect(pickRandomSubset([], 2)).toEqual([]);
    expect(pickRandomSubset(pool, 0)).toEqual([]);
  });

  it("covers the whole pool across many draws instead of favouring the head", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) for (const item of pickRandomSubset(pool, 2)) seen.add(item);
    expect(seen.size).toBe(pool.length);
  });

  it("caches enough candidates for a two-column hero to vary", () => {
    expect(2 * HERO_POOL_FACTOR).toBeGreaterThan(2);
  });
});

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}
