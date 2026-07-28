/**
 * Who is listening to what, on the site's own music player.
 *
 * Deliberately in memory, not the database. This is presence, not history:
 * every entry is worthless within minutes, writes would arrive on every track
 * change from every listener, and losing the lot on a restart costs nothing --
 * the next track anyone plays repopulates it. `lib/live.ts` keeps its SSE
 * channels the same way.
 *
 * The TTL matches the 5 minutes the users-online query uses, so "listening"
 * and "online" agree about who is still around. A tune outlasting its entry
 * just means the listener stopped reporting; entries refresh on every change.
 */

export interface Listener {
  userId: number;
  nick: string;
  /** What they are playing, already formatted for display. */
  track: string;
  /** Unix seconds when this was last reported. */
  at: number;
}

/** Presence window, in seconds. Matches /api/users-online. */
const TTL_SECONDS = 300;

const listeners = new Map<number, Listener>();

const now = (): number => Math.floor(Date.now() / 1000);

/** Record what a user is playing, replacing whatever they were playing before. */
export function setListening(userId: number, nick: string, track: string): void {
  listeners.set(userId, { userId, nick, track, at: now() });
}

/** Forget a user, e.g. when they stop playback. */
export function clearListening(userId: number): void {
  listeners.delete(userId);
}

/**
 * Everyone still listening, most recent first. Expired entries are dropped as
 * they are found, so the map cannot grow without bound from users who never
 * come back.
 */
export function listListening(): Listener[] {
  const cutoff = now() - TTL_SECONDS;
  const live: Listener[] = [];
  for (const [userId, entry] of listeners) {
    if (entry.at <= cutoff) listeners.delete(userId);
    else live.push(entry);
  }
  return live.sort((a, b) => b.at - a.at);
}
