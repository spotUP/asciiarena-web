// Partial release dates.
//
// Scene releases are often dated to the year, or the month, and no further —
// the `collys` table models this with three separate nullable columns and uses
// 0 as the "unknown" sentinel, which the release page already honours (see
// app/release/[filename]/page.tsx: `colly.month !== 0`). This module is the
// single place that converts between those columns and the "YYYY-MM-DD" text
// the date field shows, so the editor, the submit form and the picker cannot
// disagree about what "1999-00-00" means.
//
// Unknown parts are written as "00": "1999-00-00" is the year 1999 with no
// month or day, "1999-07-00" is July 1999. A day without a month is not a
// meaningful date and is rejected.

export interface PartialDate {
  y: number;
  m: number; // 0 = unknown
  d: number; // 0 = unknown
}

export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

// Columns -> field text. Returns "" when even the year is unknown, which is
// what clears the input.
export function formatPartialDate(
  y: number | null | undefined,
  m: number | null | undefined,
  d: number | null | undefined,
): string {
  if (!y) return "";
  return `${pad(y, 4)}-${pad(m || 0)}-${pad(d || 0)}`;
}

// Field text -> columns. Null when the text is not a date this system accepts.
export function parsePartialDate(text: string): PartialDate | null {
  // Not trimmed on purpose: "1994-09-04 " must not commit while the user is
  // still editing the field (lib/__tests__/date-picker-input.test.ts).
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const y = +match[1];
  const m = +match[2];
  const d = +match[3];
  if (y < 1) return null;
  if (m < 0 || m > 12) return null;
  if (d < 0) return null;
  // A day is only meaningful with a month to hang it off.
  if (m === 0 && d !== 0) return null;
  if (m > 0 && d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

// True when `text` is a date this system accepts — complete or partial.
export function isValidPartialDateString(text: string): boolean {
  return parsePartialDate(text) !== null;
}

// True only for a complete calendar date. Used where a partial date makes no
// sense (poll open/close timestamps).
export function isCompleteDateString(text: string): boolean {
  const p = parsePartialDate(text);
  return p !== null && p.m > 0 && p.d > 0;
}
