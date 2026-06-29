"use client";

import { useEffect, useState } from "react";

// Renders a Unix timestamp (seconds) as HH:MM in the visitor's LOCAL timezone.
// SSR and the first client render both emit the UTC HH:MM (deterministic — no
// hydration mismatch); a mount effect then swaps in local time. Doing it in an
// effect (vs a one-shot inline <Script>) means it re-runs on every mount,
// including client-side navigation, so the time never gets stuck showing UTC.
export default function LocalTime({ unix, className }: { unix: number; className?: string }) {
  const [text, setText] = useState(() => new Date(unix * 1000).toISOString().substring(11, 16));

  useEffect(() => {
    const d = new Date(unix * 1000);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    setText(`${h}:${m}`);
  }, [unix]);

  return <span className={className} suppressHydrationWarning>{text}</span>;
}
