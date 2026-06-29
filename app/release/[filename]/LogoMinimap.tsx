"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeMarkerPositions, type LogoIndexEntry } from "@/lib/logoSections";

interface Props {
  /** The scroll container (#colly-div). */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The <pre> (#colly) — read for its rendered line height. */
  preRef: React.RefObject<HTMLElement | null>;
  /** Logos to mark, with labels. */
  entries: LogoIndexEntry[];
  /** Blank-line spacers prepended to the rendered content (the <br> prefix). */
  spacers: number;
  /** Jump-to-logo (smooth-centres in the container). */
  onJump: (section: LogoIndexEntry["section"]) => void;
}

// A vertical scrollbar-side minimap: one clickable tick per logo at its true
// scroll position, a viewport thumb, an active highlight, and a hover label.
export default function LogoMinimap({ containerRef, preRef, entries, spacers, onJump }: Props) {
  const [tops, setTops] = useState<number[]>([]);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const lineHeight = useCallback(() => {
    const pre = preRef.current;
    return (pre && parseFloat(getComputedStyle(pre).lineHeight)) || 16;
  }, [preRef]);

  const recompute = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const lh = lineHeight();
    const trackHeight = c.clientHeight;
    const scrollHeight = c.scrollHeight || 1;
    setTops(computeMarkerPositions(entries.map((e) => e.section), { spacers, lineHeight: lh, scrollHeight, trackHeight }));
  }, [containerRef, entries, spacers, lineHeight]);

  const updateScrollState = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const trackHeight = c.clientHeight;
    const scrollHeight = c.scrollHeight || 1;
    setThumb({
      top: (c.scrollTop / scrollHeight) * trackHeight,
      height: Math.max(16, (c.clientHeight / scrollHeight) * trackHeight),
    });
    // Active logo = the one whose ink box contains the viewport centre line.
    const lh = lineHeight();
    const centreLine = (c.scrollTop + c.clientHeight / 2) / lh - spacers;
    let best = 0;
    let bestDist = Infinity;
    entries.forEach((e, i) => {
      const { inkTop, inkBottom } = e.section;
      if (centreLine >= inkTop && centreLine <= inkBottom) {
        best = i;
        bestDist = -1;
      } else if (bestDist !== -1) {
        const dist = Math.min(Math.abs(centreLine - inkTop), Math.abs(centreLine - inkBottom));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
    });
    setActive(best);
  }, [containerRef, entries, spacers, lineHeight]);

  // Recompute on mount, on container/content resize, and when the logo set changes.
  useEffect(() => {
    recompute();
    updateScrollState();
    const c = containerRef.current;
    const pre = preRef.current;
    if (!c) return;
    const onResize = () => {
      recompute();
      updateScrollState();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(c);
    if (pre) ro.observe(pre);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [recompute, updateScrollState, containerRef, preRef]);

  // Track scrolling (rAF-throttled) for the thumb + active highlight.
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateScrollState();
      });
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      c.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, updateScrollState]);

  if (entries.length < 2) return null;

  return (
    <div
      aria-label="Logo navigation"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "16px",
        height: "100%",
        zIndex: 60,
        background: "rgba(17,17,17,0.55)",
        borderLeft: "1px solid #333",
      }}
    >
      {thumb && (
        <div
          style={{
            position: "absolute",
            right: 0,
            width: "16px",
            top: `${thumb.top}px`,
            height: `${thumb.height}px`,
            background: "rgba(255,85,255,0.12)",
            pointerEvents: "none",
          }}
        />
      )}
      {entries.map((entry, i) => (
        <button
          key={i}
          type="button"
          title={entry.label}
          onClick={() => onJump(entry.section)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          style={{
            position: "absolute",
            right: 0,
            top: `${tops[i] ?? 0}px`,
            transform: "translateY(-50%)",
            width: "16px",
            height: "12px",
            minHeight: 0,
            margin: 0,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              display: "block",
              width: i === active ? "12px" : "8px",
              height: "2px",
              marginRight: "2px",
              background: i === active ? "#ff55ff" : hover === i ? "#aaaaaa" : "#555555",
            }}
          />
        </button>
      ))}
      {hover != null && tops[hover] != null && (
        <span
          style={{
            position: "absolute",
            right: "20px",
            top: `${tops[hover]}px`,
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "#aaaaaa",
            border: "1px solid #333",
            padding: "2px 6px",
            fontFamily: "monospace",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 61,
          }}
        >
          <span style={{ color: "#555", marginRight: "8px" }}>{hover + 1}</span>
          {entries[hover].label}
        </span>
      )}
    </div>
  );
}
