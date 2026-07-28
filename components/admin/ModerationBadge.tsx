"use client";

import { useEffect, useState } from "react";
import { subscribeRaw } from "@/lib/sse-pool";

interface Counts { broken: number; total: number }

// Tiny pill next to the ADMIN navbar link showing how many broken collys
// are awaiting review. Subscribes to the site:moderation channel and
// re-fetches on any event.
export default function ModerationBadge() {
  const [counts, setCounts] = useState<Counts>({ broken: 0, total: 0 });

  const refresh = () => {
    fetch("/api/admin/moderation-count")
      .then(r => r.ok ? r.json() : null)
      .then((d: Counts | null) => { if (d) setCounts(d); })
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    return subscribeRaw("site:moderation", (evt) => {
      if (evt?.type === "watching") return;
      refresh();
    });
  }, []);

  if (counts.total === 0) return null;

  const title = `${counts.broken} broken colly${counts.broken === 1 ? "" : "s"} need review`;

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
