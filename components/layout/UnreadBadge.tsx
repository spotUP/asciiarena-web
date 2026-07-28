"use client";

import { useEffect, useState } from "react";
import { subscribeRaw } from "@/lib/sse-pool";

function fetchUnread(set: (n: number) => void) {
  fetch("/api/messages/unread")
    .then(r => r.json())
    .then((d: { count?: number }) => set(d?.count ?? 0))
    .catch(() => {});
}

export default function UnreadBadge({ userId }: { userId?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchUnread(setCount);
    if (!userId) return;
    // Shares the connection with ChatBar, which is mounted on every page and
    // listens to the same channel.
    return subscribeRaw(`user:${userId}:messages`, () => fetchUnread(setCount));
  }, [userId]);

  if (count <= 0) return null;

  return (
    <span className="magenta" style={{ fontFamily: "TopazPlus_a1200, Monaco, Menlo, Consolas, monospace", marginLeft: "4px" }}>
      [{count}]
    </span>
  );
}
