// In-memory fixed-window rate limiter for the public /api/v1/* routes.
//
// Public + unauthenticated means bots can hammer it, so every v1 route calls
// checkV1RateLimit() first and returns 429 + Retry-After when over budget.
// No persistence needed: worst case after a restart is a fresh window.
//
// Budget: 120 requests / 60s per IP. Generous for chatbots, cheap to serve
// since all v1 routes are indexed SELECTs + CDN-cacheable.

const WINDOW_MS = 60_000;
const LIMIT = 120;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const V1_RATE_LIMIT = LIMIT;
export const V1_RATE_WINDOW_SECONDS = WINDOW_MS / 1000;

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 64);
  return "unknown";
}

export function checkV1RateLimit(
  key: string,
  now = Date.now(),
): { allowed: boolean; remaining: number; resetAfter: number } {
  const cur = buckets.get(key);
  if (!cur || now >= cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1, resetAfter: V1_RATE_WINDOW_SECONDS };
  }
  if (cur.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAfter: Math.ceil((cur.resetAt - now) / 1000) };
  }
  cur.count += 1;
  return { allowed: true, remaining: LIMIT - cur.count, resetAfter: Math.ceil((cur.resetAt - now) / 1000) };
}

export function v1RateHeaders(remaining: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(LIMIT),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
  };
}

// Test-only: reset all buckets.
export function resetV1RateLimit(): void {
  buckets.clear();
}
