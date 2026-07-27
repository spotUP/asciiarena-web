// The RANDOM RELEASES hero picks its art from a cached candidate pool.
//
// The pool (DB rows + their .diz reads) is expensive, so it is cached — but
// caching the *pick* is what made "random releases" stop being random: every
// visitor inside the cache window saw the identical pair until it expired.
// Caching the pool and drawing from it per request keeps the I/O saving and
// gives each page load a different draw.

/** How many candidates to cache per hero column. */
export const HERO_POOL_FACTOR = 6;

/**
 * Draw `count` distinct items from `items`, uniformly at random.
 * Never mutates the input. Returns everything (shuffled) when the pool is
 * smaller than `count`, so a thin pool degrades instead of returning blanks.
 */
export function pickRandomSubset<T>(items: readonly T[], count: number, rand: () => number = Math.random): T[] {
  const pool = items.slice();
  const take = Math.min(Math.max(0, Math.floor(count)), pool.length);
  // Partial Fisher-Yates: only the first `take` positions need to settle.
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, take);
}
