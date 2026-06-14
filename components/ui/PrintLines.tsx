"use client";

import React, { useEffect, useState } from "react";
import { SkeletonLines } from "./Skeleton";

export interface PrintLinesProps {
  children: React.ReactNode;
  /** Delay between line reveals. */
  lineDelayMs?: number;
  /** Skeleton lines holding the widget height while children are still empty
      (client-fetching widgets pass their expected row count). */
  reserveLines?: number;
}

// Reveals its children one line at a time, terminal-style. Headlines and
// background stay static -- only wrap the content rows. Unrevealed lines are
// rendered visibility:hidden so the widget keeps its full height from the
// first paint; each revealed line gets .print-line (white flash-fade, see
// assets/css/site.css). Children must be elements (the widget row divs);
// their className/style are preserved.
//
// Once all lines are printed the component is inert: rows added later (live
// refresh, SSE) appear instantly without re-animating.
export default function PrintLines({ children, lineDelayMs = 100, reserveLines = 0 }: PrintLinesProps) {
  const lines = React.Children.toArray(children);
  const [printed, setPrinted] = useState(0);

  useEffect(() => {
    if (printed >= lines.length) return;
    const t = setTimeout(() => setPrinted(p => p + 1), lineDelayMs);
    return () => clearTimeout(t);
  }, [printed, lines.length, lineDelayMs]);

  if (lines.length === 0 && reserveLines > 0) {
    // No data yet: hold the height with grey skeleton bars instead of blank
    // space, so the loading state reads as intentional and nothing shifts
    // when the real lines replace the skeleton.
    return <SkeletonLines count={reserveLines} />;
  }

  return (
    <>
      {lines.map((child, i) => {
        if (!React.isValidElement(child)) return child;
        const el = child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>;
        if (i >= printed) {
          return React.cloneElement(el, {
            style: { ...el.props.style, visibility: "hidden" },
          });
        }
        return React.cloneElement(el, {
          className: [el.props.className, "print-line"].filter(Boolean).join(" "),
        });
      })}
    </>
  );
}
