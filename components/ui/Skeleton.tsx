import React from "react";

// Text-themed skeleton loader: grey filled bars on the dark ANSI backdrop,
// one per line, each exactly one 8x16 grid row tall so replacing the
// skeleton with real content never shifts layout. Styles live in
// assets/css/site.css (.skeleton-line / .skeleton-bar).

// Deterministic per-line widths so the bars look like ragged text rather
// than a solid block. Cycled by line index (no Math.random -> SSR-safe).
const BAR_WIDTHS = ["82%", "64%", "91%", "55%", "73%", "88%", "60%", "78%", "69%", "85%", "58%", "76%"];

export function SkeletonLines({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-line" aria-hidden>
          <span className="skeleton-bar" style={{ width: BAR_WIDTHS[i % BAR_WIDTHS.length] }} />
        </div>
      ))}
    </>
  );
}
