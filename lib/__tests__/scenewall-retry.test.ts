import { describe, it, expect } from "vitest";
import { fetchScenewallWithRetry, type RetryIO } from "../scenewallRetry";

interface Stats { stats: { name: string; count: number }[] }

const parseStats = (data: unknown): Stats | null => {
  const stats = (data as { stats?: unknown })?.stats;
  return Array.isArray(stats) ? ({ stats } as Stats) : null;
};

const GOOD = { stats: [{ name: "DeaTure", count: 9386987 }] };

function io(responses: (unknown | Error)[], overrides?: Partial<RetryIO>) {
  let i = 0;
  const slept: number[] = [];
  const base: RetryIO = {
    fetchJson: () => {
      const r = responses[Math.min(i++, responses.length - 1)];
      return r instanceof Error ? Promise.reject(r) : Promise.resolve(r);
    },
    sleep: (ms) => { slept.push(ms); return Promise.resolve(); },
    isCancelled: () => false,
  };
  return { io: { ...base, ...overrides }, slept };
}

describe("scenewall widget retry (regression: one null response killed the widget until reload)", () => {
  it("recovers when the API returns null first and data on a later attempt", async () => {
    const { io: fakeIo, slept } = io([null, null, GOOD]);
    const result = await fetchScenewallWithRetry(parseStats, fakeIo, [10, 20, 30, 40]);
    expect(result).toEqual(GOOD);
    expect(slept).toEqual([10, 20]); // backed off twice before the good response
  });

  it("recovers when the fetch itself rejects before succeeding", async () => {
    const { io: fakeIo } = io([new Error("network down"), GOOD]);
    const result = await fetchScenewallWithRetry(parseStats, fakeIo, [10]);
    expect(result).toEqual(GOOD);
  });

  it("recovers when the API returns a malformed (unparseable) payload first", async () => {
    const { io: fakeIo } = io([{ unexpected: true }, GOOD]);
    const result = await fetchScenewallWithRetry(parseStats, fakeIo, [10]);
    expect(result).toEqual(GOOD);
  });

  it("returns data immediately on first success without sleeping", async () => {
    const { io: fakeIo, slept } = io([GOOD]);
    const result = await fetchScenewallWithRetry(parseStats, fakeIo, [10, 20]);
    expect(result).toEqual(GOOD);
    expect(slept).toEqual([]);
  });

  it("gives up with null after exhausting every retry", async () => {
    const { io: fakeIo, slept } = io([null]);
    const result = await fetchScenewallWithRetry(parseStats, fakeIo, [10, 20]);
    expect(result).toBeNull();
    expect(slept).toEqual([10, 20]); // used all delays, then stopped
  });

  it("stops retrying once cancelled (unmounted widget)", async () => {
    let calls = 0;
    const fakeIo: RetryIO = {
      fetchJson: () => { calls++; return Promise.resolve(null); },
      sleep: () => Promise.resolve(),
      isCancelled: () => calls >= 2, // cancel after the second attempt
    };
    const result = await fetchScenewallWithRetry(parseStats, fakeIo, [10, 20, 30]);
    expect(result).toBeNull();
    expect(calls).toBe(2);
  });
});
