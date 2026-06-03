/**
 * Shared types + a pure validator for the HippoPlayer "now playing" feed.
 *
 * The data comes from https://hippoplayer.se/cygnus/api/now-playing (proxied
 * through app/api/now-playing/route.ts). The upstream shape is an array of
 * { title, author, url, listeners }, but it is an external service we don't
 * control, so the client must never trust it blindly. `parseNowPlaying` is the
 * single place that coerces the raw payload into well-formed entries; both the
 * proxy route and the widget go through it.
 */

export interface NowPlayingEntry {
  title: string;
  author: string;
  url: string;
  listeners: number;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Coerce an unknown payload into NowPlayingEntry[].
 *
 * - Non-array input (network error, HTML error page, null) yields [].
 * - Each entry must carry a non-empty `url` string — the whole point of a row
 *   is that it is clickable, so entries without a link are dropped.
 * - `title`/`author` may legitimately be empty (some formats expose no
 *   metadata); they default to "".
 * - `listeners` defaults to 1 and is floored at 1 — a song in the feed has at
 *   least one listener.
 */
export function parseNowPlaying(data: unknown): NowPlayingEntry[] {
  if (!Array.isArray(data)) return [];
  const out: NowPlayingEntry[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const url = asString(rec.url);
    if (!url) continue;
    const listenersRaw = typeof rec.listeners === "number" ? rec.listeners : 1;
    const listeners = Number.isFinite(listenersRaw) ? Math.max(1, Math.floor(listenersRaw)) : 1;
    out.push({
      title: asString(rec.title),
      author: asString(rec.author),
      url,
      listeners,
    });
  }
  return out;
}
