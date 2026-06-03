import { unstable_cache } from "next/cache";
import { parseNowPlaying, type NowPlayingEntry } from "@/lib/nowPlaying";

// Server-side cached proxy for the HippoPlayer "now playing" feed.
//
// The upstream (https://hippoplayer.se/cygnus/api/now-playing) only sets CORS
// for the https://asciiarena.se origin, so a direct client-side fetch would
// fail from localhost in dev and is hostage to that CORS config in prod.
// Proxying server-side sidesteps CORS entirely and matches the scenewall proxy
// pattern. A short cache means HippoPlayer is hit at most ~once per CACHE_SECONDS
// no matter how many visitors are polling. The widget polls every 30s, so a
// cache a bit under that keeps each poll reasonably fresh without hammering.
const CACHE_SECONDS = 20;
const UPSTREAM = "https://hippoplayer.se/cygnus/api/now-playing";

const fetchNowPlaying = unstable_cache(
  async (): Promise<NowPlayingEntry[]> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(UPSTREAM, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (asciiarena widget proxy)", "Accept": "application/json" },
      });
      if (!r.ok) return [];
      return parseNowPlaying(await r.json());
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  },
  ["now-playing-proxy"],
  { revalidate: CACHE_SECONDS },
);

export async function GET() {
  const entries = await fetchNowPlaying();
  return Response.json(entries);
}
