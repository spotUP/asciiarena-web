"use client";

import { useEffect, useState } from "react";

type ActivityType = "view" | "comment" | "fav" | "unfav" | "wall" | "request" | "upload" | "claim";

interface ActivityEntry {
  id: number;
  type: ActivityType;
  nick: string;
  target: string;
  targetUrl: string;
  timestamp: number;
}

let entryId = 0;

function actionLabel(type: ActivityType): string {
  switch (type) {
    case "view":    return "viewing";
    case "comment": return "commented on";
    case "fav":     return "faved";
    case "unfav":   return "unfaved";
    case "wall":    return "on the wall:";
    case "request": return "requested:";
    case "upload":  return "uploaded";
    case "claim":   return "claimed artist";
  }
}

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
          return next.slice(0, 15);
        });
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  return (
    <div className="col-lg-12 p-0">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">LIVE FEED</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
        {entries.length === 0 && (
          <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 lightgrey" style={{ fontSize: "0.85em", paddingBottom: "3px" }}>
            watching...
          </div>
        )}
        {entries.map(entry => (
          <div
            key={entry.id}
            className="col-lg-12 p-0 pl-lg-2 pr-lg-2"
            style={{ fontSize: "0.85em", paddingBottom: "3px" }}
          >
            <a href={`/member/${entry.nick}`} className="yellow" style={{ marginRight: "4px" }}>
              {entry.nick}
            </a>
            <span className="lightgrey" style={{ marginRight: "4px" }}>
              {actionLabel(entry.type)}
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
