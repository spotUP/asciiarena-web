"use client";

import { useEffect, useState } from "react";

interface Props {
  channel: string;
  onReset: () => void;
  label?: (n: number) => string;
}

export default function NewItemsPill({ channel, onReset, label }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as { type?: string };
        if (evt.type === "watching" || evt.type === "update") return;
        setCount((c) => c + 1);
      } catch {}
    };
    return () => es.close();
  }, [channel]);

  if (count === 0) return null;

  const text = label
    ? label(count)
    : `^ ${count} new item${count === 1 ? "" : "s"} since you loaded — click to refresh`;

  return (
    <div
      onClick={() => {
        setCount(0);
        onReset();
      }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        cursor: "pointer",
        background: "#aa00aa",
        color: "#ffffff",
        textAlign: "center",
        height: "16px",
        lineHeight: "16px",
        padding: "0 8px",
        marginBottom: "16px",
        fontSize: "16px",
        fontFamily: "TopazPlus_a1200, monospace",
      }}
      title="Reload the list to see new items"
    >
      {text}
    </div>
  );
}
