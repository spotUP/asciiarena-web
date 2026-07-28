"use client";

import { useEffect, useState } from "react";
import { subscribeRaw } from "@/lib/sse-pool";

type ActivityType = "view" | "comment" | "fav" | "unfav" | "wall" | "request" | "upload" | "claim" | "poll";

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
    case "poll":    return "voted in poll";
    // notif-* types are personal notifications, never broadcast to the
    // site activity feed — return an empty label as a safety fallback if
    // one ever leaks through.
    default:        return "";
  }
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Dedupe: the server backfills recent events on (re)connect, so the same
    // event can arrive again after an SSE reconnect.
    const seen = new Set<string>();
    return subscribeRaw("site:activity", (raw) => {
      if (!raw) return;
      const event = raw as unknown as Omit<ActivityEntry, "id">;
      if (!event.nick || !event.target) return;
      const key = `${event.type}|${event.nick}|${event.target}|${event.timestamp}`;
      if (seen.has(key)) return;
      seen.add(key);
      setEntries(prev => {
        const next = [{ ...event, id: ++entryId }, ...prev];
        return next.slice(0, 15);
      });
    });
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
            {entry.nick === "anon" ? (
              <span className="lightgrey" style={{ marginRight: "4px" }}>anon</span>
            ) : (
              <a href={`/member/${entry.nick}`} className="yellow" style={{ marginRight: "4px" }}>
                {entry.nick}
              </a>
            )}
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
