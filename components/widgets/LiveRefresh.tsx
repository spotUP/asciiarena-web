"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeRaw } from "@/lib/sse-pool";

/**
 * Re-render this page's server components when something happens on `channel`.
 *
 * REFRESHES ARE COALESCED ACROSS EVERY INSTANCE IN THE TAB.
 *
 * The connection is already shared (lib/sse-pool.ts), but each subscriber used
 * to call router.refresh() on its own. The home page mounts four widgets on
 * site:votes and four on site:releases, so a single vote triggered four full
 * re-renders of a force-dynamic page that runs a database query per widget --
 * simultaneously, and again for the next channel. That is main-thread work and
 * server load proportional to widget count, and it lands while the visitor is
 * trying to type.
 *
 * router.refresh() is idempotent: N refreshes in a burst produce the same
 * result as one. So a burst becomes one refresh, on a trailing timer.
 */

const COALESCE_MS = 400;

let timer: ReturnType<typeof setTimeout> | null = null;
let pendingRouter: ReturnType<typeof useRouter> | null = null;

function scheduleRefresh(router: ReturnType<typeof useRouter>): void {
  // Any router instance in the tab refreshes the same tree; keep the newest.
  pendingRouter = router;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const r = pendingRouter;
    pendingRouter = null;
    r?.refresh();
  }, COALESCE_MS);
}

export default function LiveRefresh({ channel }: { channel: string }) {
  const router = useRouter();
  useEffect(
    () =>
      subscribeRaw(channel, evt => {
        // "watching" is the subscriber-count ping, not a content change.
        // An unparseable event (null) still refreshes: something happened.
        if (evt?.type === "watching") return;
        scheduleRefresh(router);
      }),
    [channel, router],
  );
  return null;
}
