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
    <div className="widget">
      <div className="widget-head">
        <h2 className="widget-title bg-header">LIVE FEED</h2>
      </div>
      {/* The feed is one line per event in a full-width card, so a single
          column left most of the row empty and pushed the card fifteen rows
          tall. .live-feed flows the same list into as many 320px columns as
          fit, up to four. */}
      <div className="widget-body bg-secondary live-feed">
        {entries.length === 0 && (
          <div className="live-feed-row lightgrey">
            watching...
          </div>
        )}
        {entries.map(entry => (
          <div key={entry.id} className="live-feed-row">
            {entry.nick === "anon" ? (
              <span className="lightgrey" style={{ marginRight: "8px" }}>anon</span>
            ) : (
              <a href={`/member/${entry.nick}`} className="yellow" style={{ marginRight: "8px" }}>
                {entry.nick}
              </a>
            )}
            <span className="lightgrey" style={{ marginRight: "8px" }}>
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
