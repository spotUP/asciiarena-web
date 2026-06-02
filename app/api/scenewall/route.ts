import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";

// Server-side cached proxy for the scenewall.bbs.io endpoints.
// Three home-page widgets (Weektop, BBSWeektop, GlobalWall) used to fetch()
// from scenewall.bbs.io:1543 client-side. That server is slow (ASP.NET/IIS,
// ~5-10s response, cache-control: no-cache) and the browser tab spinner
// stays active for the lifetime of those in-flight fetches. Proxying
// through here with a 5-minute server-side cache keeps the tab spinner
// snappy: scenewall is hit once per 5 min, every visitor gets it instantly.

type Endpoint = "weektop" | "bbs-weektop" | "globalwall";

const ENDPOINT_URL: Record<Endpoint, string> = {
  "weektop":     "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=16&Count=5",
  "bbs-weektop": "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=26&Count=5",
  "globalwall":  "https://scenewall.bbs.io:1543/GlobalWall/api/WallItems?itemcount=15",
};

const fetchScenewall = unstable_cache(
  async (endpoint: Endpoint) => {
    const ctrl = new AbortController();
    // scenewall.bbs.io is genuinely slow — it consistently takes ~10-11s to
    // respond. An earlier 8s cap aborted every request before the data arrived,
    // so the widgets always rendered empty. This runs server-side and the
    // result is cached for 5 min, and the widgets fetch it client-side behind a
    // loader, so a generous cap here delays only the (cached) widget data, never
    // the page itself. 20s gives scenewall comfortable headroom while still
    // capping a truly hung upstream.
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(ENDPOINT_URL[endpoint], {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (asciiarena widget proxy)", "Accept": "application/json" },
      });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  },
  ["scenewall-proxy"],
  { revalidate: 300 }, // 5 min
);

function isValidEndpoint(s: string | null): s is Endpoint {
  return s === "weektop" || s === "bbs-weektop" || s === "globalwall";
}

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!isValidEndpoint(endpoint)) return new Response("invalid endpoint", { status: 400 });
  const data = await fetchScenewall(endpoint);
  return Response.json(data ?? null);
}
