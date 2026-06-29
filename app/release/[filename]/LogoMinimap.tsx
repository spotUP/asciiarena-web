"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animateScroll } from "@/lib/animateScroll";
import { type LogoIndexEntry } from "@/lib/logoSections";

export const MINIMAP_WIDTH = 88; // px — keep in sync with the container's right padding

const LENS_A = 20; // peak extra weight at the cursor (magnification strength)
const LENS_SIGMA = 14; // rows — how wide the lens spreads

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

interface Model {
  yEdges: Float32Array; // output Y (css px) for each rendered row edge, length R+1
  R: number; // total rendered rows
  lineHeight: number;
  cssH: number;
}

// A text-editor-style minimap with a fisheye lens: the whole colly is painted
// tiny (a dot per non-space char), but rows near the cursor bulge larger so you
// can make out individual logos to aim at, while the ends stay compressed.
export default function LogoMinimap({ containerRef, preRef, entries, spacers, fgColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<Model | null>(null);
  const focusRef = useRef<number | null>(null); // focus row (lens centre), null = no lens
  const draggingRef = useRef(false);
  const drawRafRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [hover, setHover] = useState<{ idx: number; y: number } | null>(null);

  const lineHeight = useCallback(() => {
    const pre = preRef.current;
    return (pre && parseFloat(getComputedStyle(pre).lineHeight)) || 16;
  }, [preRef]);

  // Build the row->Y warp for the current focus and paint the thumbnail.
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
    const R = Math.max(1, Math.round(scrollHeight / lh));
    const focus = focusRef.current;

    // Weight each rendered row: uniform, plus a Gaussian bump at the cursor.
    const yEdges = new Float32Array(R + 1);
    let sum = 0;
    const weights = new Float32Array(R);
    for (let r = 0; r < R; r++) {
      let w = 1;
      if (focus != null) {
        const d = r - focus;
        w += LENS_A * Math.exp(-(d * d) / (2 * LENS_SIGMA * LENS_SIGMA));
      }
      weights[r] = w;
      sum += w;
    }
    const scale = cssH / (sum || 1);
    for (let r = 0; r < R; r++) yEdges[r + 1] = yEdges[r] + weights[r] * scale;
    yEdges[R] = cssH;
    modelRef.current = { yEdges, R, lineHeight: lh, cssH };

    let maxCols = 1;
    for (const l of lines) if (l.length > maxCols) maxCols = Math.min(l.length, 240);
    const scaleX = cssW / maxCols;
    const dotW = Math.max(0.6, scaleX);

    ctx.fillStyle = fgColor;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < lines.length; i++) {
      const r = spacers + i;
      if (r >= R) break;
      const yTop = yEdges[r];
      const h = Math.max(0.6, yEdges[r + 1] - yTop);
      const line = lines[i];
      for (let j = 0; j < line.length && j < maxCols; j++) {
        const ch = line.charCodeAt(j);
        if (ch === 32 || ch === 9) continue;
        ctx.fillRect(j * scaleX, yTop, dotW, h);
      }
    }
    ctx.globalAlpha = 1;
  }, [containerRef, preRef, lineHeight, spacers, fgColor]);

  // Interpolated output Y for a fractional rendered row.
  const yAtRow = (m: Model, rowFloat: number) => {
    const r = Math.max(0, Math.min(rowFloat, m.R));
    const i = Math.min(Math.floor(r), m.R - 1);
    const frac = r - i;
    return m.yEdges[i] + (m.yEdges[i + 1] - m.yEdges[i]) * frac;
  };

  // Inverse: which rendered row sits at output Y (binary search the warp).
  const rowAtY = (m: Model, y: number) => {
    const yy = Math.max(0, Math.min(y, m.cssH));
    let lo = 0;
    let hi = m.R;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (m.yEdges[mid + 1] < yy) lo = mid + 1;
      else hi = mid;
    }
    const span = m.yEdges[lo + 1] - m.yEdges[lo] || 1;
    return lo + (yy - m.yEdges[lo]) / span;
  };

  const updateThumb = useCallback(() => {
    const c = containerRef.current;
    const m = modelRef.current;
    if (!c || !m) return;
    const topRow = c.scrollTop / m.lineHeight;
    const botRow = (c.scrollTop + c.clientHeight) / m.lineHeight;
    const top = yAtRow(m, topRow);
    setThumb({ top, height: Math.max(8, yAtRow(m, botRow) - top) });
  }, [containerRef]);

  const scheduleDraw = useCallback(() => {
    if (drawRafRef.current != null) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      draw();
      updateThumb();
    });
  }, [draw, updateThumb]);

  // Redraw on mount and whenever the container/content resizes or fg changes.
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
      if (scrollRafRef.current != null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updateThumb();
      });
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      c.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [containerRef, updateThumb]);

  const scrollToPointer = useCallback(
    (clientY: number, smooth: boolean) => {
      const c = containerRef.current;
      const canvas = canvasRef.current;
      const m = modelRef.current;
      if (!c || !canvas || !m) return;
      const rect = canvas.getBoundingClientRect();
      const row = rowAtY(m, clientY - rect.top);
      const target = Math.max(0, Math.min(row * m.lineHeight - c.clientHeight / 2, c.scrollHeight - c.clientHeight));
      if (smooth) animateScroll(c, target, 350);
      else c.scrollTop = target;
    },
    [containerRef],
  );

  const setFocusFromPointer = (clientY: number) => {
    const canvas = canvasRef.current;
    const m = modelRef.current;
    if (!canvas || !m) return;
    const rect = canvas.getBoundingClientRect();
    // Centre the lens on the linear position under the cursor (stable to track).
    focusRef.current = ((clientY - rect.top) / rect.height) * m.R;
    scheduleDraw();
    // Hover label: nearest logo to the row currently under the cursor.
    const row = rowAtY(m, clientY - rect.top) - spacers;
    let best = 0;
    let bestD = Infinity;
    entries.forEach((e, i) => {
      const { inkTop, inkBottom } = e.section;
      const d = row >= inkTop && row <= inkBottom ? 0 : Math.min(Math.abs(row - inkTop), Math.abs(row - inkBottom));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover({ idx: best, y: clientY - rect.top });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFocusFromPointer(e.clientY);
    scrollToPointer(e.clientY, false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    setFocusFromPointer(e.clientY);
    if (draggingRef.current) scrollToPointer(e.clientY, false);
  };
  const endDrag = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  const onLeave = () => {
    focusRef.current = null;
    setHover(null);
    scheduleDraw();
  };

  if (entries.length < 2) return null;

  return (
    <div
      aria-label="Logo minimap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={onLeave}
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
