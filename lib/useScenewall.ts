"use client";

import { useEffect, useState } from "react";
import type { ScenewallEndpoint } from "./scenewall";
import { fetchScenewallWithRetry } from "./scenewallRetry";

// Client hook for the scenewall widget endpoints with retry.
//
// The API returns null when the upstream fetch failed (it is slow and
// occasionally times out, typically right after a deploy while the cache
// warms). Without retry, one null permanently killed the widget until a
// full page reload. This hook keeps the loading state (null) and retries
// with backoff (see lib/scenewallRetry.ts) until data arrives or attempts
// run out.
//
// Returns null while loading/retrying (and after every attempt failed).
// Pass a module-level parse function so the effect dependency stays stable.

export function useScenewall<T>(endpoint: ScenewallEndpoint, parse: (data: unknown) => T | null): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    fetchScenewallWithRetry(parse, {
      fetchJson: () => fetch(`/api/scenewall?endpoint=${endpoint}`).then(r => r.json()),
      sleep: (ms) => new Promise(resolve => { timer = setTimeout(resolve, ms); }),
      isCancelled: () => cancelled,
    }).then(result => { if (!cancelled && result !== null) setData(result); });

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [endpoint, parse]);

  return data;
}
