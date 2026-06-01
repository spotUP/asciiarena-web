"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Shared EventSource pool. Multiple LiveRefresh instances subscribing to the
// same channel previously opened one EventSource each (the home page was
// opening site:releases 6 times, site:votes 4 times, etc.) which pinned
// browser HTTP/2 streams and made the page feel "still loading". Now one
// EventSource serves N subscribers; it closes when the last one unmounts.
type Subscriber = () => void;
const pool = new Map<string, { es: EventSource; subs: Set<Subscriber> }>();

function subscribe(channel: string, onMessage: Subscriber): () => void {
  let entry = pool.get(channel);
  if (!entry) {
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
    const subs = new Set<Subscriber>();
    const created = { es, subs };
    pool.set(channel, created);
    es.onmessage = (e: MessageEvent<string>) => {
      let isWatching = false;
      try {
        const evt = JSON.parse(e.data) as { type?: string };
        isWatching = evt.type === "watching";
      } catch { /* fall through and notify */ }
      if (isWatching) return;
      for (const fn of created.subs) fn();
    };
    entry = created;
  }
  entry.subs.add(onMessage);
  return () => {
    const e = pool.get(channel);
    if (!e) return;
    e.subs.delete(onMessage);
    if (e.subs.size === 0) {
      e.es.close();
      pool.delete(channel);
    }
  };
}

export default function LiveRefresh({ channel }: { channel: string }) {
  const router = useRouter();
  useEffect(() => subscribe(channel, () => router.refresh()), [channel, router]);
  return null;
}
