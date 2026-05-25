"use client";

import { useEffect, useState } from "react";

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
    const es = new EventSource(`/api/live?channel=user:${userId}:messages`);
    es.onmessage = () => fetchUnread(setCount);
    return () => es.close();
  }, [userId]);

  if (count <= 0) return null;

  return (
    <span className="magenta" style={{ fontFamily: "TopazPlus_a1200, Monaco, Menlo, Consolas, monospace", marginLeft: "4px" }}>
      [{count}]
    </span>
  );
}
