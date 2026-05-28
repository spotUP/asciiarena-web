"use client";

import { useEffect, useState } from "react";

interface Counts { broken: number; pending: number; total: number }

// Tiny pill next to the ADMIN navbar link showing how many things need
// triage (broken collys + pending requests). Subscribes to the
// site:moderation channel and re-fetches on any event so it stays in
// sync with the dashboard counters.
export default function ModerationBadge() {
  const [counts, setCounts] = useState<Counts>({ broken: 0, pending: 0, total: 0 });

  const refresh = () => {
    fetch("/api/admin/moderation-count")
      .then(r => r.ok ? r.json() : null)
      .then((d: Counts | null) => { if (d) setCounts(d); })
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    const es = new EventSource(`/api/live?channel=site:moderation`);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as { type?: string };
        if (evt.type === "watching") return;
        refresh();
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  if (counts.total === 0) return null;

  const title = `${counts.broken} broken colly${counts.broken === 1 ? "" : "s"}, ${counts.pending} pending request${counts.pending === 1 ? "" : "s"}`;

  return (
    <span
      className="lightred"
      title={title}
      style={{
        marginLeft: "4px",
        padding: "0 4px",
        background: "#aa0000",
        color: "#ffffff",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "16px",
        lineHeight: "16px",
        display: "inline-block",
      }}
    >
      {counts.total}
    </span>
  );
}
