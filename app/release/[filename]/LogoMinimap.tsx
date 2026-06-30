"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animateScroll } from "@/lib/animateScroll";
import { type LogoIndexEntry } from "@/lib/logoSections";
import { cleanLabel } from "@/lib/handleMatch";

export const MINIMAP_WIDTH = 120; // px — keep in sync with the container's right padding

const LENS_A = 20; // peak extra weight at the cursor (magnification strength)
const LENS_SIGMA = 14; // rows — how wide the lens spreads
const BANDS = 320; // vertical slices used to render the warped source image
const MAX_COLS = 240;
const MAX_SRC_H = 24000; // cap the offscreen source height (memory)
const MAX_CH = 12; // max source pixels per text row (detail vs memory)

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  preRef: React.RefObject<HTMLElement | null>;
  entries: LogoIndexEntry[];
  spacers: number;
  fgColor: string;
}

interface Source {
  canvas: HTMLCanvasElement;
  srcW: number;
  ch: number; // source pixels per text row
  R: number; // total rendered rows
  lineHeight: number; // live <pre> line height (px)
}

interface Model {
  yEdges: Float32Array; // output Y (css px) per rendered-row edge, length R+1
  R: number;
  lineHeight: number;
  cssH: number;
}

// A text-editor-style minimap with a fisheye lens. The whole colly is rendered
// once to a high-resolution offscreen canvas (actual glyphs), then sampled into
// the visible strip with smoothing — so it reads like a real zoomed document
// rather than blocky dots. Rows near the cursor bulge larger; the ends compress.
export default function LogoMinimap({ containerRef, preRef, entries, spacers, fgColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRef = useRef<Source | null>(null);
  const modelRef = useRef<Model | null>(null);
  const focusRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const downYRef = useRef(0);
  const drawRafRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [hover, setHover] = useState<{ idx: number; y: number } | null>(null);

  const lineHeight = useCallback(() => {
    const pre = preRef.current;
    return (pre && parseFloat(getComputedStyle(pre).lineHeight)) || 16;
  }, [preRef]);

  // Render the colly to an offscreen canvas at a real (small) font size. Costly,
  // so only rebuilt on mount / resize / font / colour change — never on hover.
  const buildSource = useCallback(() => {
    const c = containerRef.current;
    const pre = preRef.current;
    if (!c || !pre) return;
    const lh = lineHeight();
    const R = Math.max(1, Math.round((c.scrollHeight || 1) / lh));
    const ch = Math.min(MAX_CH, Math.max(3, Math.floor(MAX_SRC_H / R)));
    const fontFamily = getComputedStyle(pre).fontFamily;
    const lines = (pre.textContent || "").split("\n");
    let maxCols = 1;
    for (const l of lines) maxCols = Math.max(maxCols, Math.min(l.length, MAX_COLS));

    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) return;
    probe.font = `${ch}px ${fontFamily}`;
    const cw = probe.measureText("M").width || ch * 0.6;
    const srcW = Math.max(1, Math.ceil(maxCols * cw));
    const srcH = Math.max(1, Math.ceil(R * ch));

    const off = sourceRef.current?.canvas ?? document.createElement("canvas");
    off.width = srcW;
    off.height = srcH;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.clearRect(0, 0, srcW, srcH);
    octx.font = `${ch}px ${fontFamily}`;
    octx.textBaseline = "top";
    octx.fillStyle = fgColor;
    for (let i = 0; i < lines.length; i++) {
      const r = spacers + i;
      if (r >= R) break;
      const line = lines[i];
      if (line.trim() !== "") octx.fillText(line.length > MAX_COLS ? line.slice(0, MAX_COLS) : line, 0, r * ch);
    }
    sourceRef.current = { canvas: off, srcW, ch, R, lineHeight: lh };
  }, [containerRef, preRef, lineHeight, spacers, fgColor]);

  // Build the row->Y warp for the current focus, then sample the source image
  // into the strip band by band (smoothed).
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const src = sourceRef.current;
    if (!canvas || !src) return;
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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const { R, ch } = src;
    const focus = focusRef.current;
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
    modelRef.current = { yEdges, R, lineHeight: src.lineHeight, cssH };

    const rowAt = (y: number) => {
      const yy = Math.max(0, Math.min(y, cssH));
      let lo = 0;
      let hi = R;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (yEdges[mid + 1] < yy) lo = mid + 1;
        else hi = mid;
      }
      const span = yEdges[lo + 1] - yEdges[lo] || 1;
      return lo + (yy - yEdges[lo]) / span;
    };

    for (let b = 0; b < BANDS; b++) {
      const outY0 = (b * cssH) / BANDS;
      const outY1 = ((b + 1) * cssH) / BANDS;
      const sy0 = rowAt(outY0) * ch;
      const sy1 = rowAt(outY1) * ch;
      const sh = Math.max(0.5, sy1 - sy0);
      ctx.drawImage(src.canvas, 0, sy0, src.srcW, sh, 0, outY0, cssW, outY1 - outY0);
    }
  }, []);

  const yAtRow = (m: Model, rowFloat: number) => {
    const r = Math.max(0, Math.min(rowFloat, m.R));
    const i = Math.min(Math.floor(r), m.R - 1);
    return m.yEdges[i] + (m.yEdges[i + 1] - m.yEdges[i]) * (r - i);
  };
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
    const top = yAtRow(m, c.scrollTop / m.lineHeight);
    const bot = yAtRow(m, (c.scrollTop + c.clientHeight) / m.lineHeight);
    setThumb({ top, height: Math.max(8, bot - top) });
  }, [containerRef]);

  const scheduleDraw = useCallback(() => {
    if (drawRafRef.current != null) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      draw();
      updateThumb();
    });
  }, [draw, updateThumb]);

  // Mount + resize/font/colour: rebuild source, then redraw.
  useEffect(() => {
    buildSource();
    draw();
    updateThumb();
    const c = containerRef.current;
    const pre = preRef.current;
    if (!c) return;
    const onResize = () => {
      buildSource();
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
  }, [buildSource, draw, updateThumb, containerRef, preRef]);

  // Scroll: just move the thumb (rAF-throttled).
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
    focusRef.current = ((clientY - rect.top) / rect.height) * m.R;
    scheduleDraw();
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
    movedRef.current = false;
    downYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFocusFromPointer(e.clientY);
    // Don't jump yet — a click eases on release; a drag scrubs live (below).
  };
  const onPointerMove = (e: React.PointerEvent) => {
    setFocusFromPointer(e.clientY);
    // Hover-to-scrub: moving over the minimap scrolls the colly live.
    if (draggingRef.current && !movedRef.current && Math.abs(e.clientY - downYRef.current) > 3) {
      movedRef.current = true;
    }
    scrollToPointer(e.clientY, false);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (draggingRef.current && !movedRef.current) scrollToPointer(e.clientY, true); // click -> eased
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
          {cleanLabel(entries[hover.idx].label)}
        </span>
      )}
    </div>
  );
}
