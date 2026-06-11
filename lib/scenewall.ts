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

export const fetchScenewall = unstable_cache(
  async (endpoint: ScenewallEndpoint) => {
    const ctrl = new AbortController();
    // scenewall.bbs.io is genuinely slow — it consistently takes ~10-11s to
    // respond. An earlier 8s cap aborted every request before the data arrived,
    // so the widgets always rendered empty. 20s gives scenewall comfortable
    // headroom while still capping a truly hung upstream.
    const timer = setTimeout(() => ctrl.abort(), 20000);
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
