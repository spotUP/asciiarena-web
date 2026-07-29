import { unstable_cache } from "next/cache";

// Server-side cached fetcher for the scenewall.bbs.io endpoints.
// Three widgets (Weektop, BBSWeektop, GlobalWall) consume this through
// /api/scenewall. That upstream is slow (ASP.NET/IIS, ~10s response,
// cache-control: no-cache), so results are cached for 5 minutes and the
// cache is warmed at server boot (instrumentation.ts) so visitors almost
// never hit a cold fetch.

export type ScenewallEndpoint = "weektop" | "bbs-weektop" | "globalwall";

const ENDPOINT_URL: Record<ScenewallEndpoint, string> = {
  "weektop":     "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=16&Count=5",
  "bbs-weektop": "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=26&Count=5",
  "globalwall":  "https://scenewall.bbs.io:1543/GlobalWall/api/WallItems?itemcount=15",
};

export function isScenewallEndpoint(s: string | null): s is ScenewallEndpoint {
  return s === "weektop" || s === "bbs-weektop" || s === "globalwall";
}

export const SCENEWALL_TIMEOUT_MS = 30000;

/**
 * One-line description of why a scenewall fetch failed.
 *
 * Kept separate from the fetcher so the timeout case reads as what it is —
 * a slow third-party widget source, not a fault in this application.
 */
export function describeFetchFailure(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") {
    return `no response within ${SCENEWALL_TIMEOUT_MS / 1000}s`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export const fetchScenewall = unstable_cache(
  async (endpoint: ScenewallEndpoint) => {
    const ctrl = new AbortController();
    // scenewall.bbs.io is genuinely slow. An earlier 8s cap aborted every
    // request before the data arrived, so the widgets always rendered empty;
    // 20s was chosen when the upstream measured ~10-11s. Measured again on
    // 2026-07-29 it takes ~15.2s, which left so little headroom that requests
    // were timing out several times a minute. 30s restores roughly the same
    // margin the 20s cap originally had, while still capping a hung upstream.
    const timer = setTimeout(() => ctrl.abort(), SCENEWALL_TIMEOUT_MS);
    try {
      const r = await fetch(ENDPOINT_URL[endpoint], {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (asciiarena widget proxy)", "Accept": "application/json" },
      });
      // Throw (rather than return null) on failure: unstable_cache caches
      // whatever the function RETURNS, including null — one failed upstream
      // fetch (e.g. right after a service restart) would otherwise pin the
      // widgets empty for the whole 5-minute revalidate window. A thrown
      // error is never cached, so the next request retries immediately.
      if (!r.ok) throw new Error(`scenewall ${endpoint}: HTTP ${r.status}`);
      return await r.json();
    } catch (err) {
      // Rethrow as a plain Error. An aborted fetch rejects with a DOMException,
      // and Next logs a failed revalidation by dumping the thrown object — for
      // a DOMException that is the error plus its 25 enumerable constants
      // (INDEX_SIZE_ERR, DOMSTRING_SIZE_ERR, ...), 27 journal lines per
      // timeout. That buried real errors in the log. The rethrow keeps the
      // no-cache-on-failure behaviour above and costs one legible line.
      throw new Error(`scenewall ${endpoint}: ${describeFetchFailure(err)}`);
    } finally {
      clearTimeout(timer);
    }
  },
  ["scenewall-proxy"],
  { revalidate: 300 }, // 5 min
);

// Fire-and-forget cache warm-up, called from instrumentation.ts at server
// boot. Without this, the first visitor after every deploy pays the ~10s
// upstream latency (or gets an empty widget if the cold fetch fails).
export function warmScenewallCache(): void {
  const endpoints: ScenewallEndpoint[] = ["weektop", "bbs-weektop", "globalwall"];
  for (const endpoint of endpoints) {
    fetchScenewall(endpoint).catch(() => {
      // Boot-time warm-up is best-effort; the request path retries on demand.
    });
  }
}
