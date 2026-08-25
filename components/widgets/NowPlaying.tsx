"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PrintLines from "@/components/ui/PrintLines";

/**
 * Who is listening to what, in the site's own music player.
 *
 * This used to mirror hippoplayer.se's now-playing feed. The site has its own
 * player now, so the sidebar shows the people who are actually here instead of
 * activity on another site.
 *
 * Presence lives in memory on the server with a 5 minute window, and the player
 * reports a track change as it happens, so polling only has to be often enough
 * to feel live. There is no SSE channel for it: one small poll is cheaper than
 * holding another stream open per tab, and a logged-in page already holds
 * several.
 */
const POLL_MS = 20_000;

interface Listener {
  userId: number;
  nick: string;
  track: string;
  at: number;
}

function load(set: (entries: Listener[]) => void) {
  fetch("/api/now-playing/site")
    .then(r => (r.ok ? r.json() : []))
    .then((d: unknown) => set(Array.isArray(d) ? (d as Listener[]) : []))
    .catch(() => { /* keep the last good list on a transient failure */ });
}

export default function NowPlaying() {
  const [entries, setEntries] = useState<Listener[]>([]);

  useEffect(() => {
    load(setEntries);
    const interval = setInterval(() => load(setEntries), POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Nobody listening: no widget, rather than an empty box.
  if (entries.length === 0) return null;

  return (
    <div className="widget">
      <div className="widget-head">
        <h2 className="widget-title bg-header">PLAYING NOW</h2>
      </div>
      <div className="widget-body bg-secondary">
        <PrintLines>
          {entries.map(entry => (
            <div
              key={entry.userId}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <Link
                prefetch={false}
                href={`/member/${entry.nick}`}
                className="yellow text-truncate"
                style={{ flexShrink: 0 }}
              >
                {entry.nick}
              </Link>
              <span
                className="text-truncate"
                style={{ color: "#aaaaaa", paddingLeft: "8px" }}
                title={entry.track}
              >
                {entry.track}
              </span>
            </div>
          ))}
        </PrintLines>
      </div>
    </div>
  );
}
