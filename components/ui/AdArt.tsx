import React from "react";

// BBS text-ad viewer: same presentation as the ASCII logo gallery
// (app/logos): TopazPlus at native 16px, shrinking to fit wide art,
// dark card, scroll-safe. Art is user data - React escapes it by default,
// never render it as HTML. ANSI color codes are stripped here so every
// caller gets display-ready text; stored bytes stay untouched.
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]|\x1b/g, "");
}

export default function AdArt({ lines }: { lines: string[] }) {
  const clean = lines.map(stripAnsi);
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
