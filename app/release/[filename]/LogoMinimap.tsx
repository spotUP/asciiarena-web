"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animateScroll } from "@/lib/animateScroll";
import { computeMarkerPositions, type LogoIndexEntry } from "@/lib/logoSections";

export const MINIMAP_WIDTH = 88; // px — keep in sync with the container's right padding

interface Props {
  /** The scroll container (#colly-div). */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The <pre> (#colly) — read for text + rendered line height. */
  preRef: React.RefObject<HTMLElement | null>;
  /** Logos, for the hover label. */
  entries: LogoIndexEntry[];
  /** Blank-line spacers prepended to the rendered content (the <br> prefix). */
  spacers: number;
  /** Foreground colour to paint the thumbnail with (redraws when it changes). */
  fgColor: string;
}

// A text-editor-style minimap: the whole colly rendered tiny (a dot per
// non-space char) so you see the actual document shape, with a draggable
// viewport thumb, click/drag-to-scroll, and a hover label for the nearest logo.
export default function LogoMinimap({ containerRef, preRef, entries, spacers, fgColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [hover, setHover] = useState<{ idx: number; y: number } | null>(null);
  const dragging = useRef(false);
  const rafRef = useRef<number | null>(null);

  const lineHeight = useCallback(() => {
    const pre = preRef.current;
    return (pre && parseFloat(getComputedStyle(pre).lineHeight)) || 16;
  }, [preRef]);

  // Paint the thumbnail. Each non-space char becomes a tiny rect, positioned by
  // the same line/column grid the <pre> uses, scaled to the track.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const c = containerRef.current;
    const pre = preRef.current;
    if (!canvas || !c || !pre) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW === 0 || cssH === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const text = pre.textContent || "";
    const lines = text.split("\n");
    const lh = lineHeight();
    const scrollHeight = c.scrollHeight || 1;
    let maxCols = 1;
    for (const l of lines) if (l.length > maxCols) maxCols = Math.min(l.length, 240);

    const scaleX = cssW / maxCols;
    const pxPerLine = (lh / scrollHeight) * cssH; // height of one text row on the track
    const dotW = Math.max(0.6, scaleX);
    const dotH = Math.max(0.6, pxPerLine);

    ctx.fillStyle = fgColor;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const y = (spacers + i) * pxPerLine;
      if (y > cssH) break;
      for (let j = 0; j < line.length && j < maxCols; j++) {
        const ch = line.charCodeAt(j);
        if (ch === 32 || ch === 9) continue; // space / tab
        ctx.fillRect(j * scaleX, y, dotW, dotH);
      }
    }
    ctx.globalAlpha = 1;
  }, [containerRef, preRef, lineHeight, spacers, fgColor]);

  const updateThumb = useCallback(() => {
    const c = containerRef.current;
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    const cssH = canvas.clientHeight;
    const scrollHeight = c.scrollHeight || 1;
    setThumb({
      top: (c.scrollTop / scrollHeight) * cssH,
      height: Math.max(16, (c.clientHeight / scrollHeight) * cssH),
    });
  }, [containerRef]);

  // Redraw on mount and whenever the container/content resizes (font load) or fg changes.
  useEffect(() => {
    draw();
    updateThumb();
    const c = containerRef.current;
    const pre = preRef.current;
    if (!c) return;
    const onResize = () => {
      draw();
      updateThumb();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(c);
    if (pre) ro.observe(pre);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [draw, updateThumb, containerRef, preRef]);

  // Track scrolling (rAF-throttled) for the thumb.
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateThumb();
      });
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      c.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, updateThumb]);

  // Map a pointer Y on the track to a scroll position (centred on the cursor).
  const scrollToPointer = useCallback(
    (clientY: number, smooth: boolean) => {
      const c = containerRef.current;
      const canvas = canvasRef.current;
      if (!c || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const frac = Math.max(0, Math.min((clientY - rect.top) / rect.height, 1));
      const target = Math.max(0, Math.min(frac * c.scrollHeight - c.clientHeight / 2, c.scrollHeight - c.clientHeight));
      if (smooth) animateScroll(c, target, 350);
      else c.scrollTop = target;
    },
    [containerRef],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    scrollToPointer(e.clientY, false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) {
      scrollToPointer(e.clientY, false);
      return;
    }
    // Hover: show the nearest logo's label.
    const canvas = canvasRef.current;
    const c = containerRef.current;
    if (!canvas || !c || entries.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const tops = computeMarkerPositions(
      entries.map((en) => en.section),
      { spacers, lineHeight: lineHeight(), scrollHeight: c.scrollHeight || 1, trackHeight: rect.height },
    );
    let best = 0;
    let bestD = Infinity;
    tops.forEach((t, i) => {
      const d = Math.abs(t - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover({ idx: best, y: tops[best] });
  };
  const endDrag = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  if (entries.length < 2) return null;

  return (
    <div
      aria-label="Logo minimap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={() => setHover(null)}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: `${MINIMAP_WIDTH}px`,
        height: "100%",
        zIndex: 60,
        background: "rgba(17,17,17,0.6)",
        borderLeft: "1px solid #333",
        cursor: "pointer",
        touchAction: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      {thumb && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${thumb.top}px`,
            height: `${thumb.height}px`,
            background: "rgba(255,85,255,0.14)",
            border: "1px solid rgba(255,85,255,0.5)",
            pointerEvents: "none",
          }}
        />
      )}
      {hover && (
        <span
          style={{
            position: "absolute",
            right: `${MINIMAP_WIDTH + 4}px`,
            top: `${hover.y}px`,
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
          <span style={{ color: "#555", marginRight: "8px" }}>{hover.idx + 1}</span>
          {entries[hover.idx].label}
        </span>
      )}
    </div>
  );
}
