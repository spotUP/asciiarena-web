"use client";

import { useEffect, useRef, useState } from "react";

// Terminal-styled date picker: Topaz font + 8x16 grid, matching the site. Native
// <input type="date"> renders its text + calendar popup in the browser's own
// font (off-grid), so this replaces it everywhere. Value is "YYYY-MM-DD" (or "").

export interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  /** Earliest selectable year (default 1980 — the demoscene era). */
  minYear?: number;
  placeholder?: string;
  className?: string;
}

// Date + time field (value "YYYY-MM-DDTHH:MM") — the date via the calendar
// picker, the time as a small Topaz text input. For datetime-local replacements.
export function DateTimePicker({ value, onChange, minYear }: { value: string; onChange: (v: string) => void; minYear?: number }) {
  const [datePart = "", timePart = ""] = value ? value.split("T") : [];
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <DatePicker value={datePart} minYear={minYear} onChange={(d) => onChange(d ? `${d}T${timePart || "00:00"}` : "")} />
      <input
        type="text"
        className="form-control"
        placeholder="HH:MM"
        maxLength={5}
        value={timePart}
        onChange={(e) => onChange(datePart ? `${datePart}T${e.target.value}` : "")}
        style={{ width: "80px" }}
      />
    </div>
  );
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const fmt = (y: number, m: number, d: number) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;

function parse(value: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}

/**
 * True when `text` is a real calendar date in "YYYY-MM-DD" form. Typed input
 * is committed only when this passes, so a half-finished "1994-0" never
 * reaches the caller and "1994-02-30" is rejected outright.
 */
export function isValidDateString(text: string): boolean {
  const p = parse(text);
  if (!p) return false;
  if (p.m < 1 || p.m > 12) return false;
  return p.d >= 1 && p.d <= daysInMonth(p.y, p.m);
}

const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
// Monday-first weekday index (0=Mon..6=Sun) for the 1st of the month.
const firstWeekday = (y: number, m: number) => (new Date(y, m - 1, 1).getDay() + 6) % 7;

export default function DatePicker({ value, onChange, minYear = 1980, placeholder = "YYYY-MM-DD", className }: DatePickerProps) {
  const parsed = parse(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  // Typed text, held locally until it parses as a real date. null = show the
  // committed `value`. Without this the field could only be filled from the
  // calendar, which is slow for the 30-year back-catalogue of release dates.
  const [draft, setDraft] = useState<string | null>(null);
  const [viewY, setViewY] = useState(parsed?.y ?? today.getFullYear());
  const [viewM, setViewM] = useState(parsed?.m ?? today.getMonth() + 1); // 1-12
  const rootRef = useRef<HTMLDivElement>(null);

  // Re-sync the visible month to the value whenever the picker is opened.
  useEffect(() => {
    if (!open) return;
    const p = parse(value);
    if (p) { setViewY(p.y); setViewM(p.m); }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const stepMonth = (delta: number) => {
    let m = viewM + delta;
    let y = viewY;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setViewM(m); setViewY(y);
  };
  const stepYear = (delta: number) => setViewY((y) => Math.max(minYear, y + delta));

  const pick = (d: number) => { setDraft(null); onChange(fmt(viewY, viewM, d)); setOpen(false); };

  const typeDate = (text: string) => {
    setDraft(text);
    // Commit as soon as the text is a real date; clearing the field clears the
    // value. Anything in between stays local so the form never sees a partial.
    if (isValidDateString(text)) { onChange(text); setDraft(null); }
    else if (text.trim() === "") onChange("");
  };

  // Leaving a half-typed field discards the draft and shows the committed
  // value again, so the input can never display something the form does not
  // actually hold.
  const commitOrRevert = () => setDraft(null);

  const lead = firstWeekday(viewY, viewM);
  const total = daysInMonth(viewY, viewM);
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const nav: React.CSSProperties = {
    cursor: "pointer", padding: "0 8px", height: "16px", lineHeight: "16px",
    color: "#aaaaaa", background: "transparent", border: "none", fontFamily: "inherit", fontSize: "16px",
  };

  return (
    <div ref={rootRef} className={className} style={{ position: "relative", display: "inline-block" }}>
      <input
        type="text"
        className="form-control"
        value={draft ?? value ?? ""}
        placeholder={placeholder}
        maxLength={10}
        inputMode="numeric"
        onChange={(e) => typeDate(e.target.value)}
        onBlur={commitOrRevert}
        // Opens on click but does not toggle shut again — a second click is
        // usually the user placing the caret to edit the text, not asking to
        // dismiss the calendar. Escape and an outside click still close it.
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); commitOrRevert(); }
          if (e.key === "Enter") { setOpen(false); commitOrRevert(); }
        }}
        style={{ width: "160px" }}
      />
      {open && (
        <div
          style={{
            position: "absolute", zIndex: 300, top: "100%", left: 0, marginTop: "8px",
            background: "#111111", border: "1px solid #333333", padding: "8px",
            fontFamily: "inherit", fontSize: "16px", lineHeight: "16px", userSelect: "none",
          }}
        >
          {/* Header: << year  < month   Mon YYYY   month >  year >> */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span>
              <button type="button" style={nav} title="Previous year" onClick={() => stepYear(-1)}>{"<<"}</button>
              <button type="button" style={nav} title="Previous month" onClick={() => stepMonth(-1)}>{"<"}</button>
            </span>
            <span style={{ color: "#ff55ff", whiteSpace: "nowrap" }}>{MONTHS[viewM - 1]} {pad(viewY, 4)}</span>
            <span>
              <button type="button" style={nav} title="Next month" onClick={() => stepMonth(1)}>{">"}</button>
              <button type="button" style={nav} title="Next year" onClick={() => stepYear(1)}>{">>"}</button>
            </span>
          </div>
          {/* Weekday header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gridAutoRows: "16px" }}>
            {WEEKDAYS.map((w) => (
              <span key={w} style={{ textAlign: "center", color: "#555555" }}>{w}</span>
            ))}
          </div>
          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gridAutoRows: "16px", marginTop: "8px" }}>
            {cells.map((d, i) => {
              const selected = !!parsed && d != null && parsed.y === viewY && parsed.m === viewM && parsed.d === d;
              return (
                <span
                  key={i}
                  onClick={d != null ? () => pick(d) : undefined}
                  style={{
                    textAlign: "center", height: "16px", lineHeight: "16px",
                    cursor: d != null ? "pointer" : "default",
                    color: selected ? "#111111" : d != null ? "#aaaaaa" : "transparent",
                    background: selected ? "#ff55ff" : "transparent",
                  }}
                  className={d != null && !selected ? "datepicker-day" : undefined}
                >
                  {d ?? ""}
                </span>
              );
            })}
          </div>
          {/* Clear */}
          {value && (
            <div style={{ marginTop: "8px", textAlign: "right" }}>
              <button type="button" style={{ ...nav, padding: 0 }} onClick={() => { setDraft(null); onChange(""); setOpen(false); }}>clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
