"use client";

import { useEffect, useState } from "react";

interface OnlineEvent {
  type?: string;
  activeUsers?: Array<{ id: number; nick: string }>;
}

export default function OnlineDot({ nick }: { nick: string }) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const apply = (users: Array<{ nick: string }> | undefined) => {
      if (!users) return;
      setOnline(users.some((u) => u.nick === nick));
    };

    fetch("/api/users-online")
      .then((r) => r.json())
      .then((d: OnlineEvent) => apply(d.activeUsers))
      .catch(() => {});

    const es = new EventSource("/api/live?channel=site:online");
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as OnlineEvent;
        if (evt.type === "update") apply(evt.activeUsers);
      } catch {}
    };
    return () => es.close();
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
