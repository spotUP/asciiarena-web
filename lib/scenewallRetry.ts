// Pure retry driver for the scenewall widget fetches — extracted from
// useScenewall so the retry behaviour is unit-testable without a DOM.
//
// The /api/scenewall proxy returns null when its upstream fetch failed
// (slow ASP.NET server, typically right after a deploy while the cache
// warms). The regression this guards against: widgets treated one null
// as final and rendered dead-empty until a full page reload.

export const SCENEWALL_RETRY_DELAYS_MS = [5000, 10000, 20000, 30000];

export interface RetryIO {
  fetchJson: () => Promise<unknown>;
  sleep: (ms: number) => Promise<void>;
  isCancelled: () => boolean;
}

export async function fetchScenewallWithRetry<T>(
  parse: (data: unknown) => T | null,
  io: RetryIO,
  delays: number[] = SCENEWALL_RETRY_DELAYS_MS,
): Promise<T | null> {
  for (let round = 0; ; round++) {
    if (io.isCancelled()) return null;
    let parsed: T | null = null;
    try {
      const raw = await io.fetchJson();
      parsed = raw === null ? null : parse(raw);
    } catch {
      parsed = null;
    }
    if (io.isCancelled()) return null;
    if (parsed !== null) return parsed;
    if (round >= delays.length) return null;
    await io.sleep(delays[round]);
  }
}
