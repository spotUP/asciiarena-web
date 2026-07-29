// A small TTL cache that keeps serving the last good value while the source is
// failing, and never throws.
//
// Written for the scenewall widgets, whose upstream (scenewall.bbs.io, an
// ASP.NET/IIS box) answers in ~15s when it answers at all and regularly exceeds
// 30s. `unstable_cache` could not express what those widgets need:
//
//   - It caches whatever the function RETURNS, so returning null on failure
//     pinned the widgets empty for the whole revalidate window.
//   - Throwing instead avoids caching the failure, but there is then nothing to
//     serve, so the widget goes blank on a blip -- and Next logs every failed
//     background revalidation by dumping the thrown value together with the
//     minified source of the fetcher it was revalidating. That is what filled
//     the journal with 27-line DOMException dumps.
//
// Neither option is "keep showing last week's top uploaders while the far end
// is down", which is what a third-party widget actually wants. Hence this.
//
// Time and fetching are injected so the policy can be tested without timers or
// a network, in the same spirit as lib/scenewallRetry.ts.

export interface StaleCacheIO<T> {
  /** Milliseconds since the epoch. */
  now: () => number;
  /** Fetch a fresh value. May reject; the cache turns that into stale-or-null. */
  fetch: (key: string) => Promise<T>;
  /** Called once per failed fetch, for logging. Must not throw. */
  onFailure?: (key: string, error: unknown) => void;
}

export interface StaleCachePolicy {
  /** Serve a cached value without refetching for this long. */
  ttlMs: number;
  /**
   * Once the source is failing, keep serving a cached value up to this age.
   * Past it, report null rather than present indefinitely-old data as current.
   */
  maxStaleMs: number;
}

export interface StaleCache<T> {
  get: (key: string) => Promise<T | null>;
  /** Test/observability helper: age of the entry in ms, or null if absent. */
  ageOf: (key: string) => number | null;
}

interface Entry<T> {
  value: T;
  storedAt: number;
}

export function createStaleWhileErrorCache<T>(
  io: StaleCacheIO<T>,
  policy: StaleCachePolicy,
): StaleCache<T> {
  const entries = new Map<string, Entry<T>>();
  // One in-flight fetch per key. Without this, N simultaneous cache misses
  // become N requests to an upstream that is already too slow to keep up.
  const inFlight = new Map<string, Promise<T | null>>();

  async function refresh(key: string, stale: Entry<T> | undefined): Promise<T | null> {
    try {
      const value = await io.fetch(key);
      entries.set(key, { value, storedAt: io.now() });
      return value;
    } catch (error) {
      io.onFailure?.(key, error);
      if (stale && io.now() - stale.storedAt <= policy.maxStaleMs) return stale.value;
      return null;
    } finally {
      inFlight.delete(key);
    }
  }

  return {
    async get(key) {
      const entry = entries.get(key);
      if (entry && io.now() - entry.storedAt < policy.ttlMs) return entry.value;

      const pending = inFlight.get(key);
      if (pending) return pending;

      const promise = refresh(key, entry);
      inFlight.set(key, promise);
      return promise;
    },
    ageOf(key) {
      const entry = entries.get(key);
      return entry ? io.now() - entry.storedAt : null;
    },
  };
}
