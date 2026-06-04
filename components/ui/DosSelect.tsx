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
  const [filter, setFilter] = useState("");
  // Which row is highlighted. Inline styles override CSS :hover, so the hover
  // bar has to be driven from state instead of the .dropdown-item:hover rule.
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const current = options.find(o => o.value === value);

  // Inline filter at the top of the menu (like the old site) for long lists.
  const showFilter = options.length > 7;
  const q = filter.trim().toLowerCase();
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    setFilter("");
    setHovered(null);
    const fid = setTimeout(() => filterRef.current?.focus(), 0);
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => { clearTimeout(fid); document.removeEventListener("mousedown", h); };
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
        <div
          className="dropdown-menu"
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: width ? `${width}px` : "auto",
            maxHeight: "320px",
            margin: 0,
            padding: 0,
            zIndex: 200,
          }}
        >
          {showFilter && (
            <input
              ref={filterRef}
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") { setOpen(false); }
                else if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered.length > 0) { onChange(filtered[0].value); setOpen(false); }
                }
              }}
              placeholder="filter..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                height: "32px",
                border: 0,
                borderBottom: "1px solid #666",
                background: "#212121",
                color: "#ffffff",
                fontFamily: "TopazPlus_a1200, monospace",
                fontSize: "16px",
                lineHeight: "16px",
                // Horizontal padding only: the site's block-caret overlay
                // centres the caret via (clientHeight - lineHeight)/2 and assumes
                // inputs have no vertical padding. Adding top padding double-counts
                // and drops the caret below the text.
                padding: "0 8px",
                outline: "none",
              }}
            />
          )}
          <ul
            onMouseLeave={() => setHovered(null)}
            style={{ margin: 0, padding: 0, listStyle: "none", overflowY: "auto", flex: 1 }}
          >
            {filtered.length === 0 ? (
              <li
                style={{
                  padding: "0 8px",
                  height: "16px",
                  lineHeight: "16px",
                  fontSize: "16px",
                  fontFamily: "TopazPlus_a1200, monospace",
                  color: "#666",
                }}
              >
                no matches
              </li>
            ) : filtered.map(o => (
              <li key={o.value}>
                <button
                  type="button"
                  className="dropdown-item"
                  onMouseEnter={() => setHovered(o.value)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{
                    // Highlight follows the mouse; with nothing hovered it rests
                    // on the selected row.
                    width: "100%",
                    textAlign: "left",
                    border: 0,
                    background: o.value === (hovered ?? value) ? "#888888" : "transparent",
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
        </div>
      )}
    </div>
  );
}
