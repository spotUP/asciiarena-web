"use client";

import { useEffect, useState } from "react";

interface ActivityEntry {
  id: number;
  type: "view" | "comment";
  nick: string;
  target: string;
  targetUrl: string;
  timestamp: number;
}

let entryId = 0;

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/live?channel=site:activity");
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as Omit<ActivityEntry, "id">;
        if (!event.nick || !event.target) return;
        setEntries(prev => {
          const next = [{ ...event, id: ++entryId }, ...prev];
          return next.slice(0, 12);
        });
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="col-lg-12 p-0">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">LIVE FEED</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="col-lg-12 p-0 pl-lg-2 pr-lg-2"
            style={{ fontSize: "0.85em", paddingBottom: "3px" }}
          >
            <a href={`/member/${entry.nick}`} className="yellow" style={{ marginRight: "4px" }}>
              {entry.nick}
            </a>
            <span className="lightgrey">
              {entry.type === "comment" ? "commented on " : ""}
            </span>
            <a href={entry.targetUrl} style={{ color: "#aaaaaa" }}>
              {entry.target}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
