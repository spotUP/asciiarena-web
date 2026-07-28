"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveComboboxCommit } from "@/lib/combobox-commit";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: ComboboxOption[];
  onChange: (v: string) => void;
  width?: number;
  placeholder?: string;
  /**
   * Singular noun for the create-new sentinel row, e.g. "artist", "crew",
   * "BBS". When set, an entry like "+ Create new artist: typed text" is
   * appended to the menu whenever the typed text doesn't match any existing
   * option case-insensitively. When omitted, the combobox is filter-only.
   */
  createLabel?: string;
}

/**
 * Type-or-pick combobox. Looks like the .dos-select-trigger (#2a2a2a
 * input matching the form-control text inputs) and opens a Bootstrap
 * .dropdown-menu — same visual language as DosSelect — but the trigger
 * is a real <input type="text"> so the user can type. The menu filters
 * existing options case-insensitively, and when createLabel is provided
 * and the typed text doesn't match anything exactly it appends a
 * "+ Create new <createLabel>: <typed text>" sentinel that picks the
 * typed text verbatim. The receiving server is expected to ensure-or-
 * create the row on submit.
 */
export default function Combobox({ value, options, onChange, width, placeholder, createLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setTyped(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = useMemo(() => {
    const q = typed.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [typed, options]);

  const hasExactMatch = useMemo(() => {
    const q = typed.trim().toLowerCase();
    return options.some(o => o.label.toLowerCase() === q);
  }, [typed, options]);

  const showCreate = !!createLabel && typed.trim().length > 0 && !hasExactMatch;

  /**
   * Commit typed-but-unconfirmed text when the field loses focus.
   *
   * Without this, typing a name and going straight to Submit dropped it: the
   * parent was only ever told about a value from pick(), i.e. clicking an
   * option or pressing Enter. Collys were saved with no artist and no crew.
   */
  const commitTyped = () => {
    const next = resolveComboboxCommit(
      typed,
      value,
      options.map(o => o.value),
      { allowCreate: !!createLabel },
    );
    if (next === null) {
      setTyped(value); // discarded: put the field back to what it holds
      return;
    }
    onChange(next);
    setTyped(next);
  };

  const pick = (v: string) => {
    onChange(v);
    setTyped(v);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <input
        type="text"
        className="dos-select-trigger"
        value={typed}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={commitTyped}
        onChange={e => {
          setTyped(e.target.value);
          setOpen(true);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (filtered.length > 0) pick(filtered[0].value);
            else if (showCreate) pick(typed.trim());
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        style={{
          color: "#ffffff",
          border: 0,
          height: "16px",
          minHeight: 0,
          maxHeight: "16px",
          lineHeight: "16px",
          padding: "0 8px",
          fontSize: "16px",
          fontFamily: "TopazPlus_a1200, monospace",
          width: width ? `${width}px` : undefined,
          boxSizing: "border-box",
        }}
      />
      {open && (filtered.length > 0 || showCreate) && (
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
          {filtered.map(o => (
            <li key={o.value}>
              <button
                type="button"
                className="dropdown-item"
                onMouseDown={e => { e.preventDefault(); pick(o.value); }}
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
          {showCreate && (
            <li>
              <button
                type="button"
                className="dropdown-item magenta"
                onMouseDown={e => { e.preventDefault(); pick(typed.trim()); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  background: "transparent",
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
                + Create new {createLabel}: {typed.trim()}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
