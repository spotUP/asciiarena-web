"use client";

import { useEffect, useState } from "react";
import { subscribeRaw } from "@/lib/sse-pool";

interface Props {
  channel: string;
}

// Tiny "N viewing" chip for entity pages (release/artist/crew/bbs). The SSE
// endpoint in app/api/live/route.ts broadcasts a { type: "watching", count }
// event whenever any client subscribes or unsubscribes on the channel, so we
// don't need a dedicated broadcast point — just subscribing to a
// unique-per-page channel name is enough to participate in the count.
//
// Sharing the connection via lib/sse-pool.ts is what makes the count honest: a
// page that also mounts LiveRefresh on the same channel used to open two
// streams and count itself twice.
export default function WatchingPip({ channel }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(
    () =>
      subscribeRaw(channel, (evt) => {
        if (evt?.type === "watching" && typeof evt.count === "number") {
          setCount(evt.count);
        }
      }),
    [channel],
  );

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
