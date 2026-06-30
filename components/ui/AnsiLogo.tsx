"use client";

import { useEffect, useState } from "react";
import { loadAnsiLove } from "@/lib/ansilove";

// ansiB64 -> rendered PNG data URL. Rendering ANSI is async + costs the 276KB
// AnsiLove.js; caching the PNG keeps re-shows instant (header rotation, admin
// re-renders) and lets us display a plain <img> (trivial to scale, untouched by
// the copper gradient, no canvas re-parenting headaches). Shared by the rotating
// site header (LogoHeader) and the logos admin list.
const ansiCache = new Map<string, string>();

function decodeBase64(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export interface AnsiLogoProps {
  ansiB64: string;
  font: string | null;
  /** Max rendered height in px (the canvas is scaled with pure CSS). */
  maxHeight?: number;
  /** Knock the black background out to transparent so it blends over the page. */
  transparentBg?: boolean;
  /** Render width in columns. Set to the art's max line width to avoid AnsiLove's
   *  default-160 wrap (which would add rows and misalign line overlays). */
  columns?: number;
}

// AnsiLove draws an opaque black background. Make near-black pixels transparent
// so the logo blends over the header gradient instead of sitting in a black box.
function knockOutBlack(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 24 && d[i + 1] < 24 && d[i + 2] < 24) d[i + 3] = 0;
  }
  ctx.putImageData(img, 0, 0);
}

export default function AnsiLogo({ ansiB64, font, maxHeight = 220, transparentBg = false, columns }: AnsiLogoProps) {
  const cacheKey = `${transparentBg ? "t" : "o"}:${columns ?? ""}:${ansiB64}`;
  const [src, setSrc] = useState<string | null>(() => ansiCache.get(cacheKey) ?? null);

  useEffect(() => {
    const cached = ansiCache.get(cacheKey);
    if (cached) { setSrc(cached); return; }
    const bytes = decodeBase64(ansiB64);
    if (!bytes) return;
    let cancelled = false;
    loadAnsiLove()
      .then(api => {
        if (cancelled) return;
        api.renderBytes(
          bytes,
          (canvas) => {
            if (cancelled) return;
            try {
              if (transparentBg) knockOutBlack(canvas);
              const url = canvas.toDataURL("image/png");
              ansiCache.set(cacheKey, url);
              setSrc(url);
            } catch { /* tainted/oversized canvas — skip */ }
          },
          { font: font ?? "topaz", bits: "8", icecolors: 1, filetype: "ans", ...(columns && columns > 0 ? { columns } : {}) },
          () => { /* render failure — leave slot empty */ },
        );
      })
      .catch(() => { /* AnsiLove.js failed to load — leave slot empty */ });
    return () => { cancelled = true; };
  }, [ansiB64, font, transparentBg, cacheKey]);

  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{
        maxHeight: `${maxHeight}px`,
        width: "auto",
        maxWidth: "100%",
        imageRendering: "pixelated",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}
