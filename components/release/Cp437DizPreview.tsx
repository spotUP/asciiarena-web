"use client";

import { useEffect, useState } from "react";
import { loadAnsiLove } from "@/lib/ansilove";

// Renders a PC/CP437 file_id.diz preview through AnsiLove's IBM bitmap font so
// block glyphs tile without the gaps the Amiga webfont leaves, then recolours
// the monochrome output to `fg` with a transparent background (so the summary
// card colour shows through). Mirrors the colly viewer's recolour trick.

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

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [255, 85, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export interface Cp437DizPreviewProps {
  /** Base64 of the raw CP437 diz bytes. */
  bytesB64: string;
  /** Foreground colour for the (monochrome) art. Defaults to the site magenta. */
  fg?: string;
}

export default function Cp437DizPreview({ bytesB64, fg = "#ff55ff" }: Cp437DizPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const bytes = decodeBase64(bytesB64);
    if (!bytes) return;
    let cancelled = false;

    loadAnsiLove().then(api => {
      if (cancelled) return;
      api.renderBytes(
        bytes,
        (canvas) => {
          if (cancelled) return;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = img.data;
            const [r, g, b] = hexToRgb(fg);
            for (let i = 0; i < d.length; i += 4) {
              if (d[i] || d[i + 1] || d[i + 2]) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
              else { d[i + 3] = 0; } // black background -> transparent
            }
            ctx.putImageData(img, 0, 0);
          }
          try { setSrc(canvas.toDataURL("image/png")); } catch { /* tainted canvas */ }
        },
        // "diz" trims trailing empty columns to the file_id.diz content width
        // (<=45 cols), so the preview renders at native size in the card column
        // instead of being padded to 80 cols and downscaled (which looked
        // distorted under image-rendering: pixelated).
        { font: "80x25", bits: "8", icecolors: 1, filetype: "diz" },
        () => { /* render failure — leave empty */ },
      );
    }).catch(() => { /* AnsiLove failed to load — leave empty */ });

    return () => { cancelled = true; };
  }, [bytesB64, fg]);

  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{ imageRendering: "pixelated", maxWidth: "100%", height: "auto", display: "block" }}
    />
  );
}
