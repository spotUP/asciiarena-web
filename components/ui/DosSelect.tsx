"use client";

import { useEffect, useRef, useState } from "react";

export interface DosSelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: DosSelectOption[];
  onChange: (v: string) => void;
  width?: number;
  placeholder?: string;
}

/**
 * BS386-themed select. Native <select> open menus can't be fully restyled
 * across browsers, so this renders the trigger as a 16px-tall button and
 * the open list as a Bootstrap .dropdown-menu (already styled grey/black
 * in overrides.css) for a consistent DOS-menu look.
 */
export default function DosSelect({ value, options, onChange, width, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: "#444444",
          color: "#ffffff",
          border: 0,
          height: "16px",
          lineHeight: "16px",
          padding: "0 24px 0 8px",
          fontSize: "16px",
          fontFamily: "TopazPlus_a1200, monospace",
          width: width ? `${width}px` : undefined,
          textAlign: "left",
          cursor: "pointer",
          position: "relative",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {current ? current.label : (placeholder ?? "")}
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: "8px",
            top: 0,
            color: "#aaaaaa",
            pointerEvents: "none",
          }}
        >
          v
        </span>
      </button>
      {open && (
        <ul
          className="dropdown-menu"
          style={{
            display: "block",
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: width ? `${width}px` : "auto",
            maxHeight: "320px",
            overflowY: "auto",
            margin: 0,
            padding: 0,
            zIndex: 200,
          }}
        >
          {options.map(o => (
            <li key={o.value}>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  background: o.value === value ? "#888888" : "transparent",
                  fontFamily: "TopazPlus_a1200, monospace",
                  fontSize: "16px",
                  lineHeight: "16px",
                  padding: "0 8px",
                  height: "16px",
                  cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
