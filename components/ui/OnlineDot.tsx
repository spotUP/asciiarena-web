"use client";

import { useEffect, useState } from "react";
import { subscribeRaw } from "@/lib/sse-pool";

interface OnlineEvent {
  type?: string;
  activeUsers?: Array<{ id: number; nick: string }>;
}

// This component is rendered once per person in a list, so it must never own
// per-instance network work -- N rows would otherwise mean N site:online
// streams and N roster fetches. The pool in lib/sse-pool.ts collapses the
// streams onto the one UsersOnlineLive already holds; the cache below collapses
// the initial fetch.
//
// The roster is only needed for first paint. After that every mounted dot is
// kept current by the "update" events, so a short TTL is enough: it covers a
// page render and a client-side navigation without pinning a stale answer.
const ROSTER_TTL_MS = 15_000;
let rosterCache: { at: number; promise: Promise<Array<{ nick: string }> | undefined> } | null = null;

function fetchRosterShared(): Promise<Array<{ nick: string }> | undefined> {
  const now = Date.now();
  if (!rosterCache || now - rosterCache.at > ROSTER_TTL_MS) {
    rosterCache = {
      at: now,
      promise: fetch("/api/users-online")
        .then((r) => r.json())
        .then((d: OnlineEvent) => d.activeUsers)
        .catch(() => undefined),
    };
  }
  return rosterCache.promise;
}

export default function OnlineDot({ nick }: { nick: string }) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apply = (users: Array<{ nick: string }> | undefined) => {
      if (!users || cancelled) return;
      setOnline(users.some((u) => u.nick === nick));
    };

    fetchRosterShared().then(apply);

    const unsubscribe = subscribeRaw("site:online", (evt) => {
      if (evt?.type === "update") apply((evt as OnlineEvent).activeUsers);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [nick]);

  if (!online) return null;
  return (
    <span
      title={`${nick} is online right now`}
      className="green"
      style={{
        marginLeft: "8px",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "16px",
        lineHeight: "16px",
      }}
    >
      [*]
    </span>
  );
}
