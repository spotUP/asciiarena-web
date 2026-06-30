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

// fileContent is HTML-escaped (it's injected via dangerouslySetInnerHTML), so
// ">" arrives as "&gt;". Decode the few entities before parsing.
function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function lineEntries(line: string): CollyIndexEntry[] {
  const out: CollyIndexEntry[] = [];
  for (const cell of line.split(/\s{2,}/)) {
    const m = /^\s*([oO\d]{1,3})\s*[>)]\s*(.+?)\s*$/.exec(cell);
    if (!m) continue;
    const num = parseNum(m[1]);
    if (num == null) continue;
    const name = m[2]
      .replace(/\s*\|.*$/, "") // drop "| for ..." dedication cruft
      .replace(/[>)\].:|=_-]+$/, "")
      .trim();
    if (name.replace(/[^a-zA-Z0-9]/g, "").length < 2) continue;
    out.push({ num, name });
  }
  return out;
}

export function parseCollyIndex(text: string): CollyIndexEntry[] {
  const lines = decodeEntities(text).split("\n");
  // Pick the longest CONTIGUOUS run of index lines (the real TOC block), not
  // scattered per-logo header lines that also look like "N> NAME".
  let best: CollyIndexEntry[] = [];
  let cur: CollyIndexEntry[] = [];
  const flush = () => { if (cur.length > best.length) best = cur; cur = []; };
  for (const line of lines) {
    const es = lineEntries(line);
    if (es.length) cur.push(...es);
    else flush();
  }
  flush();
  if (best.length < 3) return [];
  // Dedupe by number, sort, sanity-check it's a near-contiguous sequence from ~1.
  const byNum = new Map<number, string>();
  for (const e of best) if (!byNum.has(e.num)) byNum.set(e.num, e.name);
  const out = [...byNum.entries()].map(([num, name]) => ({ num, name })).sort((a, b) => a.num - b.num);
  if (out.length < 3 || out[0].num > 2 || out[out.length - 1].num > out.length * 2 + 2) return [];
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
  if (en.length >= 4) {
    for (const li of logoIndex) {
      const ln = normalizeHandle(li.label);
      // The detected label may wrap the index name ("o1> STATiC DESC | for ..."),
      // so a containment match maps the TOC entry to its logo.
      if (ln.length >= 4 && (ln === en || ln.includes(en) || en.includes(ln))) return li.section;
    }
  }
  const i = entry.num - 1;
  return sections[i] ?? null;
}
