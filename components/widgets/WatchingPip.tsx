"use client";

import { useEffect, useState } from "react";

interface Props {
  channel: string;
}

// Tiny "N viewing" chip for entity pages (release/artist/crew/bbs). The SSE
// endpoint in app/api/live/route.ts broadcasts a { type: "watching", count }
// event whenever any client subscribes or unsubscribes on the channel, so we
// don't need a dedicated broadcast point — just opening an EventSource on a
// unique-per-page channel name is enough to participate in the count.
export default function WatchingPip({ channel }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as { type?: string; count?: number };
        if (evt.type === "watching" && typeof evt.count === "number") {
          setCount(evt.count);
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [channel]);

  if (count == null || count < 1) return null;

  return (
    <span
      className="lightcyan"
      style={{
        marginLeft: "16px",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "16px",
        lineHeight: "16px",
      }}
      title={`${count} ${count === 1 ? "person is" : "people are"} viewing this right now`}
    >
      [{count} viewing]
    </span>
  );
}
