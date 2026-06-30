import { normalizeHandle } from "@/lib/handleMatch";
import type { LogoIndexEntry, LogoSection } from "@/lib/logoSections";

// Parse a colly's embedded index / table-of-contents block, e.g.:
//   o1> STATiC DESC           o7> THE ROGUELANDS
//   o2> ATTENTiON TO DETAiL   o8> DUB DESC
// where "o" doubles as "0" (o1=1, 1o=10). Returns the entries in number order,
// or [] when no plausible index is found.

export interface CollyIndexEntry {
  num: number;
  name: string;
}

// "o1"/"1o"/"o5"/"11" -> number. Reject big numbers (years like 2o11 are part
// of a name, not an index number).
function parseNum(s: string): number | null {
  const d = s.replace(/[oO]/g, "0");
  if (!/^\d{1,3}$/.test(d)) return null;
  const n = parseInt(d, 10);
  return n >= 1 && n <= 99 ? n : null;
}

export function parseCollyIndex(text: string): CollyIndexEntry[] {
  const raw: CollyIndexEntry[] = [];
  for (const line of text.split("\n")) {
    // Split a row into columns on runs of 2+ spaces, parse "NUM> NAME" cells.
    for (const cell of line.split(/\s{2,}/)) {
      const m = /^\s*([oO\d]{1,3})\s*[>)]\s*(.+?)\s*$/.exec(cell);
      if (!m) continue;
      const num = parseNum(m[1]);
      if (num == null) continue;
      const name = m[2].replace(/[>)\].:|=_-]+$/, "").trim();
      if (name.replace(/[^a-zA-Z0-9]/g, "").length < 2) continue;
      raw.push({ num, name });
    }
  }
  if (raw.length < 3) return [];
  // Dedupe by number, sort.
  const byNum = new Map<number, string>();
  for (const e of raw) if (!byNum.has(e.num)) byNum.set(e.num, e.name);
  const out = [...byNum.entries()].map(([num, name]) => ({ num, name })).sort((a, b) => a.num - b.num);
  // Sanity: a real index starts near 1 and is roughly contiguous (guards against
  // random art lines that happen to look like "N> x").
  if (out.length < 3) return [];
  if (out[0].num > 2) return [];
  if (out[out.length - 1].num > out.length * 2 + 2) return [];
  return out;
}

// Map an index entry to a detected logo section: prefer a normalized name match
// against the detected labels, else fall back to the entry's number (1-based).
export function sectionForIndexEntry(
  entry: CollyIndexEntry,
  logoIndex: LogoIndexEntry[],
  sections: LogoSection[],
): LogoSection | null {
  const en = normalizeHandle(entry.name);
  if (en.length >= 3) {
    for (const li of logoIndex) {
      const ln = normalizeHandle(li.label);
      if (ln.length >= 3 && (ln === en || en.startsWith(ln) || ln.startsWith(en))) return li.section;
    }
  }
  const i = entry.num - 1;
  return sections[i] ?? null;
}
