"use client";
import { useEffect, useState } from "react";
import { parseNowPlaying, type NowPlayingEntry } from "@/lib/nowPlaying";

// Live "now playing in HippoPlayer" feed. Polls the cached proxy at
// /api/now-playing every 30s (HippoPlayer heartbeats every 30s, so 30s polling
// gives ~0-30s latency). The proxy collapses every visitor's polling into one
// upstream hit per cache window, so this stays cheap regardless of traffic.
//
// There is no SSE channel for this feed — it originates on hippoplayer.se, not
// in asciiarena's own realtime infra — so a plain interval is the right tool
// rather than the EventSource pattern the in-house widgets use.
const POLL_MS = 30_000;

function load(set: (entries: NowPlayingEntry[]) => void) {
  fetch("/api/now-playing")
    .then(r => (r.ok ? r.json() : []))
    .then((d: unknown) => set(parseNowPlaying(d)))
    .catch(() => { /* keep last good data on a transient failure */ });
}

export default function NowPlaying() {
  const [entries, setEntries] = useState<NowPlayingEntry[]>([]);

  useEffect(() => {
    load(setEntries);
    const interval = setInterval(() => load(setEntries), POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Hide the whole section when nobody is playing anything.
  if (entries.length === 0) return null;

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">PLAYING IN HIPPOPLAYER</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
        {entries.map(entry => {
          const label = entry.title || entry.author || "Unknown track";
          return (
            <div key={entry.url} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-truncate"
                style={{ color: "#aaaaaa" }}
                title={entry.author ? `${label} - ${entry.author}` : label}
              >
                <span className="yellow">{label}</span>
                {entry.title && entry.author && (
                  <span style={{ color: "#aaaaaa" }}> - {entry.author}</span>
                )}
              </a>
              {entry.listeners > 1 && (
                <span className="text-truncate cyan" style={{ paddingLeft: "8px", flexShrink: 0 }}>
                  ({entry.listeners} listeners)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
