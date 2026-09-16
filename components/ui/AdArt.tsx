"use client";

import React, { useMemo } from "react";
import AnsiLogo from "@/components/ui/AnsiLogo";
import { encodeCp437, toBase64, hasAnsi } from "@/lib/cp437";

// Smart BBS text-ad viewer. Detection, in order:
// 1. ANSI escape sequences present (or the DB is_ansi flag) -> full-color
//    AnsiLove render in Topaz, the same engine as the logo gallery. The DB
//    stores decoded text, so re-encode to CP437 bytes first (ASCII art and
//    escapes round-trip exactly).
// 2. Anything else -> the gallery-style TopazPlus <pre> card.
// Art is user data - React escapes it by default, never render it as HTML.
export default function AdArt({ lines, isAnsi }: { lines: string[]; isAnsi?: boolean | number | null }) {
  const text = useMemo(() => lines.join("\n"), [lines]);
  const ansi = isAnsi ? true : hasAnsi(text);

  const b64 = useMemo(() => {
    if (!ansi) return null;
    try {
      return toBase64(encodeCp437(text));
    } catch {
      return null;
    }
  }, [ansi, text]);

  if (ansi && b64) {
    return <AnsiLogo ansiB64={b64} font="topaz" />;
  }

  const clean = text.split("\n");
  const cols = clean.reduce((m, l) => Math.max(m, l.length), 1);
  const fs = `min(16px, calc(200cqw / ${cols}))`;
  return (
    <div
      style={{
        containerType: "inline-size",
        display: "flex",
        alignItems: "safe center",
        justifyContent: "safe center",
        overflow: "auto",
        background: "#0a0a0a",
      }}
    >
      <pre
        style={{
          margin: 0,
          fontFamily: "TopazPlus_a1200, monospace",
          fontSize: fs,
          lineHeight: fs,
          whiteSpace: "pre",
          color: "#cccccc",
        }}
      >
        {clean.join("\n")}
      </pre>
    </div>
  );
}
