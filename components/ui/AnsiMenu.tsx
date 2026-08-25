"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A drop-down menu drawn the way the rest of the site is drawn.
 *
 * Pages here had grown rows of a dozen buttons because a button was the only
 * control the theme offered. This is the other one: a labelled trigger and a
 * list of items on the 8x16 grid, in the site's own panel colours, with ASCII
 * for state -- `[X]` and `[ ]` for a toggle, `>` for the item in force -- the
 * way a BBS menu marks it. No icons, no animation, no rounded corners.
 *
 * Behaviour worth knowing:
 *
 * - A toggle keeps the menu open (`keepOpen`), because you usually flip two or
 *   three settings in a row; an action closes it.
 * - The menu closes on an outside pointerdown and on Escape, and returns focus
 *   to the trigger, so it can be driven from the keyboard.
 * - Items are plain buttons or links -- a link is a real <a>, so middle-click
 *   and "open in new tab" work on the share targets.
 */

export interface AnsiMenuItem {
  /** Item text. Keep it short; the menu sizes itself to the longest one. */
  label: string;
  /** Action items. Omit both this and `href` for a heading. */
  onSelect?: () => void;
  /** Link items -- rendered as a real anchor. */
  href?: string;
  /** External links open in a new tab. */
  external?: boolean;
  /** Renders `[X]` / `[ ]` before the label. */
  checked?: boolean;
  /** Marks the item in force with `>`, for a one-of-many list like the font. */
  current?: boolean;
  /** Leave the menu open after choosing -- for toggles and settings. */
  keepOpen?: boolean;
  /** A rule between groups. Set on its own; label is ignored. */
  separator?: boolean;
  /** Arbitrary content instead of a label (the colour rows use this). */
  render?: ReactNode;
}

interface Props {
  /** Trigger text. A `v` is appended, as on the site's other drop-downs. */
  label: string;
  items: AnsiMenuItem[];
  /** Trigger width. Defaults to filling its grid cell. */
  width?: string;
  /** Menu width; defaults to 264px (33 characters). */
  menuWidth?: string;
}

const ROW: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "16px",
  lineHeight: "16px",
  padding: "0 8px",
  border: 0,
  background: "transparent",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontFamily: "TopazPlus_a1200, Monaco, Menlo, Consolas, \"Courier New\", monospace",
  fontSize: "16px",
  cursor: "pointer",
  color: "#cccccc",
  textDecoration: "none",
};

/** `[X] ` / `[ ] ` / `>   ` / four spaces, so every label starts in one column. */
function marker(item: AnsiMenuItem): string {
  if (item.checked !== undefined) return item.checked ? "[X] " : "[ ] ";
  if (item.current !== undefined) return item.current ? ">   " : "    ";
  return "";
}

export default function AnsiMenu({ label, items, width, menuWidth = "264px" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", width: width ?? "100%" }}>
      <button
        ref={triggerRef}
        type="button"
        className="btn-big bg-header grey-text"
        style={{ width: "100%" }}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(o => !o)}
      >
        {label} v
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 200,
            width: menuWidth,
            marginTop: "8px",
            padding: "8px 0",
            background: "#222222",
            /* A single-pixel rule rather than a border box: the site draws its
               panels as flat blocks, and a 1px outline is the only thing that
               separates this one from the art behind it. */
            outline: "1px solid #555555",
          }}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return (
                <div
                  key={`sep-${i}`}
                  style={{ height: "16px", lineHeight: "16px", padding: "0 8px", color: "#555555", overflow: "hidden" }}
                  aria-hidden="true"
                >
                  {"-".repeat(64)}
                </div>
              );
            }
            if (item.render) {
              return (
                <div key={`row-${i}`} style={{ padding: "0 8px", minHeight: "16px" }}>
                  {item.render}
                </div>
              );
            }
            const text = `${marker(item)}${item.label}`;
            const close = () => { if (!item.keepOpen) setOpen(false); };
            if (item.href) {
              return (
                <a
                  key={`item-${i}`}
                  role="menuitem"
                  className="ansi-menu-item"
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  style={ROW}
                  onClick={close}
                >
                  {text}
                </a>
              );
            }
            return (
              <button
                key={`item-${i}`}
                role="menuitem"
                type="button"
                className="ansi-menu-item"
                style={ROW}
                onClick={() => { item.onSelect?.(); close(); }}
              >
                {text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
