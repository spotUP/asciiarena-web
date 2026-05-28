"use client";

import { useEffect, useState } from "react";

function fmt(remainingSec: number): { text: string; ending: boolean } {
  if (remainingSec <= 0) return { text: "ended", ending: true };
  const d = Math.floor(remainingSec / 86400);
  const h = Math.floor((remainingSec % 86400) / 3600);
  const m = Math.floor((remainingSec % 3600) / 60);
  const s = remainingSec % 60;
  if (d > 0) return { text: `${d}d ${h}h ${m}m`, ending: false };
  if (h > 0) return { text: `${h}h ${m}m ${s}s`, ending: false };
  if (m > 0) return { text: `${m}m ${s}s`, ending: m < 5 };
  return { text: `${s}s`, ending: true };
}

interface Props {
  closesAt: number; // unix seconds
}

// Lives in the poll's header bar. Ticks every second locally. The server
// poll-state still gates voting independently; this is purely a visual cue.
export default function PollCountdown({ closesAt }: Props) {
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = closesAt - now;
  const { text, ending } = fmt(remaining);
  return (
    <span className={ending ? "lightred" : "lightgreen"} style={{ marginLeft: "16px" }}>
      [{remaining <= 0 ? "ended" : `closes in ${text}`}]
    </span>
  );
}
