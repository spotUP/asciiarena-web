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
  /** Match the height of form-control text inputs (16px top+bottom padding,
   *  48px tall) when sitting in a form alongside them. */
  padded?: boolean;
}

/**
 * BS386-themed select. Native <select> open menus can't be fully restyled
 * across browsers, so this renders the trigger as a 16px-tall button and
 * the open list as a Bootstrap .dropdown-menu (already styled grey/black
 * in overrides.css) for a consistent DOS-menu look.
 */
export default function DosSelect({ value, options, onChange, width, placeholder, padded }: Props) {
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
        className="dos-select-trigger"
        style={{
          color: "#ffffff",
          border: 0,
          height: padded ? "48px" : "16px",
          minHeight: 0,
          maxHeight: padded ? "48px" : "16px",
          lineHeight: "16px",
          padding: padded ? "16px 8px" : "0 8px",
          fontSize: "16px",
          fontFamily: "TopazPlus_a1200, monospace",
          width: width ? `${width}px` : undefined,
          cursor: "pointer",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current ? current.label : (placeholder ?? "")}
        </span>
        <span aria-hidden className="lightgrey" style={{ flexShrink: 0 }}>v</span>
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
                  minHeight: 0,
                  maxHeight: "16px",
                  cursor: "pointer",
                  boxSizing: "border-box",
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
