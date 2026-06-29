"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";

// Renders compact relative time ("2h", "1d") since a Unix timestamp (seconds).
// Relative time is monotonic in a newest-first list and timezone-independent, so
// the Last Callers widget no longer looks scrambled across days. Recomputed on
// mount and once a minute so it stays current without a reload.
export default function RelativeTime({ unix, className }: { unix: number; className?: string }) {
  // Date.now() differs slightly between SSR and hydration, so suppress the
  // mismatch; the mount effect immediately recomputes against the client clock.
  const [text, setText] = useState(() => formatRelativeTime(unix, Date.now()));

  useEffect(() => {
    const update = () => setText(formatRelativeTime(unix, Date.now()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [unix]);

  return <span className={className} suppressHydrationWarning>{text}</span>;
}
