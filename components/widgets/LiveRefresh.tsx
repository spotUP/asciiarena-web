"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeRaw } from "@/lib/sse-pool";

// Re-render the server components on this page whenever anything happens on
// the channel. The connection itself is shared with every other subscriber in
// the tab -- see lib/sse-pool.ts.
export default function LiveRefresh({ channel }: { channel: string }) {
  const router = useRouter();
  useEffect(
    () =>
      subscribeRaw(channel, (evt) => {
        // "watching" is the subscriber-count ping, not a content change.
        // An unparseable event (null) still refreshes: something happened.
        if (evt?.type === "watching") return;
        router.refresh();
      }),
    [channel, router],
  );
  return null;
}
