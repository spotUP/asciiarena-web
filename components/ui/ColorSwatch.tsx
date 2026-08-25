"use client";

import { useEffect, useRef, useState } from "react";

// The 16-colour EGA/VGA palette used across the colly viewer + submit/dry-run.
export const COLOR_OPTIONS = [
  { value: "#555555", label: "Bright Black" },
  { value: "#5555ff", label: "Bright Blue" },
  { value: "#ff55ff", label: "Bright Magenta" },
  { value: "#ff5555", label: "Bright Red" },
  { value: "#ffff55", label: "Bright Yellow" },
  { value: "#55ff55", label: "Bright Green" },
  { value: "#55FFFF", label: "Bright Cyan" },
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#0000aa", label: "Blue" },
  { value: "#aa00aa", label: "Magenta" },
  { value: "#aa0000", label: "Red" },
  { value: "#aa5500", label: "Yellow" },
  { value: "#00aa00", label: "Green" },
  { value: "#00aaaa", label: "Cyan" },
  { value: "#aaaaaa", label: "Grey" },
];

export default function ColorSwatch({ current, onChange }: { current: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        // One character wide was hard to hit and hard to see; two is still
        // on the 8x16 grid.
        style={{ width: "16px", height: "16px", background: current, border: "none", padding: 0, cursor: "pointer", display: "block" }}
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 100,
          background: "#222", border: "1px solid #555", padding: "4px",
          display: "grid", gridTemplateColumns: "repeat(8, 20px)", gap: "2px",
        }}>
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.value}
              title={c.label}
              style={{
                width: "20px", height: "20px", background: c.value, cursor: "pointer",
                border: current === c.value ? "2px solid white" : "1px solid #555", padding: 0,
              }}
              onClick={() => { onChange(c.value); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
