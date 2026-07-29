import { createStaleWhileErrorCache } from "@/lib/staleWhileErrorCache";

// Server-side cached fetcher for the scenewall.bbs.io endpoints.
// Three widgets (Weektop, BBSWeektop, GlobalWall) consume this through
// /api/scenewall. The upstream is an ASP.NET/IIS box that answers in ~15s when
// it answers at all, sends cache-control: no-cache, and regularly exceeds even
// a 30s budget -- so results are cached, the cache is warmed at boot
// (instrumentation.ts), and a failing upstream keeps serving the last good
// value instead of blanking the widgets. See lib/staleWhileErrorCache.ts for
// why unstable_cache could not express that.

export type ScenewallEndpoint = "weektop" | "bbs-weektop" | "globalwall";

const ENDPOINT_URL: Record<ScenewallEndpoint, string> = {
  "weektop":     "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=16&Count=5",
  "bbs-weektop": "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=26&Count=5",
  "globalwall":  "https://scenewall.bbs.io:1543/GlobalWall/api/WallItems?itemcount=15",
};

export function isScenewallEndpoint(s: string | null): s is ScenewallEndpoint {
  return s === "weektop" || s === "bbs-weektop" || s === "globalwall";
}

/**
 * An earlier 8s cap aborted every request before the data arrived, so the
 * widgets always rendered empty; 20s was chosen when the upstream measured
 * ~10-11s. Measured again on 2026-07-29 it takes ~15.2s and still overran 30s
 * repeatedly. The timeout is no longer what keeps the widgets populated --
 * serving stale on failure is -- so this is now only a cap on how long one
 * request may occupy a connection.
 */
export const SCENEWALL_TIMEOUT_MS = 30000;

/** Serve a cached payload without refetching for five minutes. */
export const SCENEWALL_TTL_MS = 300000;

/**
 * How old a cached payload may get while the upstream is failing before we
 * report nothing instead. Six hours: long enough to ride out an outage of the
 * kind this upstream actually has, short enough that a widget headed "weektop"
 * is not quietly showing last week.
 */
export const SCENEWALL_MAX_STALE_MS = 6 * 60 * 60 * 1000;

/** One-line description of why a fetch failed, for the log. */
export function describeFetchFailure(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") {
    return `no response within ${SCENEWALL_TIMEOUT_MS / 1000}s`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

async function fetchUpstream(endpoint: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SCENEWALL_TIMEOUT_MS);
  try {
    const r = await fetch(ENDPOINT_URL[endpoint as ScenewallEndpoint], {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (asciiarena widget proxy)", "Accept": "application/json" },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

const cache = createStaleWhileErrorCache<unknown>(
  {
    now: () => Date.now(),
    fetch: fetchUpstream,
    onFailure: (key, error) => {
      // One line. The previous arrangement let the rejection escape into Next's
      // cache layer, which logged the thrown DOMException plus its 25
      // enumerable constants and the minified fetcher source -- 27 lines per
      // timeout, several times a minute, burying every real error in the
      // journal.
      console.warn(`scenewall ${key}: ${describeFetchFailure(error)}`);
    },
  },
  { ttlMs: SCENEWALL_TTL_MS, maxStaleMs: SCENEWALL_MAX_STALE_MS },
);

/** Cached payload for an endpoint, or null if there is nothing usable to show. */
export function fetchScenewall(endpoint: ScenewallEndpoint): Promise<unknown> {
  return cache.get(endpoint);
}

// Fire-and-forget cache warm-up, called from instrumentation.ts at server
// boot. Without this, the first visitor after every deploy pays the upstream
// latency (or gets an empty widget if the cold fetch fails).
export function warmScenewallCache(): void {
  const endpoints: ScenewallEndpoint[] = ["weektop", "bbs-weektop", "globalwall"];
  for (const endpoint of endpoints) {
    // get() never rejects, so there is nothing to catch.
    void fetchScenewall(endpoint);
  }
}
