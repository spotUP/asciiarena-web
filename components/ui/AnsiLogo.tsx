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
}

export default function AnsiLogo({ ansiB64, font, maxHeight = 220 }: AnsiLogoProps) {
  const [src, setSrc] = useState<string | null>(() => ansiCache.get(ansiB64) ?? null);

  useEffect(() => {
    const cached = ansiCache.get(ansiB64);
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
              const url = canvas.toDataURL("image/png");
              ansiCache.set(ansiB64, url);
              setSrc(url);
            } catch { /* tainted/oversized canvas — skip */ }
          },
          { font: font ?? "topaz", bits: "8", icecolors: 1, filetype: "ans" },
          () => { /* render failure — leave slot empty */ },
        );
      })
      .catch(() => { /* AnsiLove.js failed to load — leave slot empty */ });
    return () => { cancelled = true; };
  }, [ansiB64, font]);

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
