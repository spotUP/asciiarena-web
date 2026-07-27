// Which announcement the bar should show, and for how long.
//
// Pure and Prisma-free: the same rule has to hold for logged-in members (whose
// "already seen" state lives in news_reads) and anonymous visitors (whose state
// lives in localStorage), so it is expressed once over a list of seen ids
// rather than twice in two different fetch paths.

export interface NewsItem {
  id: number;
  title: string;
  body: string;
  created_at: number;
  /** False for items published to /news that should not interrupt anyone. */
  banner: boolean;
}

/** How long the bar stays on screen before hiding itself and counting as read. */
export const BANNER_VISIBLE_MS = 10_000;

/** localStorage key holding the ids an anonymous visitor has already seen. */
export const SEEN_STORAGE_KEY = "asciiarena:news:seen";

/**
 * The single newest announcement this viewer has not seen, or null.
 *
 * Newest-unread-only on purpose: the bar is one line and one idea, and with
 * auto-hide a backlog drains one item per page view instead of turning the top
 * of the page into a slideshow.
 */
export function pickBannerItem(items: NewsItem[], seenIds: number[]): NewsItem | null {
  const seen = new Set(seenIds);
  let best: NewsItem | null = null;
  for (const item of items) {
    if (!item.banner) continue;
    if (seen.has(item.id)) continue;
    if (!best || item.created_at > best.created_at || (item.created_at === best.created_at && item.id > best.id)) {
      best = item;
    }
  }
  return best;
}

/** Bounded so a long-lived browser cannot grow the key without limit. */
export const MAX_REMEMBERED_SEEN = 200;

export function rememberSeen(seenIds: number[], id: number): number[] {
  if (seenIds.includes(id)) return seenIds;
  return [id, ...seenIds].slice(0, MAX_REMEMBERED_SEEN);
}

export function parseSeen(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  } catch {
    return [];
  }
}
