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

// The longest CONTIGUOUS run of index lines (the real TOC block) — not the
// scattered per-logo header lines that also look like "N> NAME". Returns the
// entries plus the set of (0-based) line indices the block occupies.
function findIndexBlock(decodedLines: string[]): { entries: CollyIndexEntry[]; lines: Set<number> } | null {
  let best = { entries: [] as CollyIndexEntry[], lines: new Set<number>() };
  let cur = { entries: [] as CollyIndexEntry[], lines: new Set<number>() };
  const flush = () => { if (cur.entries.length > best.entries.length) best = cur; cur = { entries: [], lines: new Set() }; };
  decodedLines.forEach((line, i) => {
    const es = lineEntries(line);
    if (es.length) { cur.entries.push(...es); cur.lines.add(i); }
    else flush();
  });
  flush();
  if (best.entries.length < 3) return null;
  const nums = best.entries.map((e) => e.num).sort((a, b) => a - b);
  if (nums[0] > 2 || nums[nums.length - 1] > best.entries.length * 2 + 2) return null;
  return best;
}

export function parseCollyIndex(text: string): CollyIndexEntry[] {
  const block = findIndexBlock(decodeEntities(text).split("\n"));
  if (!block) return [];
  const byNum = new Map<number, string>();
  for (const e of block.entries) if (!byNum.has(e.num)) byNum.set(e.num, e.name);
  return [...byNum.entries()].map(([num, name]) => ({ num, name })).sort((a, b) => a.num - b.num);
}

// Wrap each index entry in the rendered (HTML) colly with a clickable span
// carrying the target logo's start line, so the embedded "oN> NAME" table is
// clickable in place. Returns the HTML unchanged when there's no index block.
export function linkifyCollyIndex(html: string, targetLine: (e: CollyIndexEntry) => number | null): string {
  const lines = html.split("\n");
  const block = findIndexBlock(lines.map(decodeEntities));
  if (!block) return html;
  for (const i of block.lines) {
    lines[i] = lines[i].replace(
      /([oO\d]{1,3})(&gt;|[>)])([ \t]+)([^<\n]+?)(?=\s{2,}|<|$)/g,
      (full: string, numTok: string, _gt: string, _sp: string, rawName: string) => {
        const num = parseNum(numTok);
        if (num == null) return full;
        const name = rawName.replace(/\s*\|.*$/, "").replace(/[>)\].:|=_-]+$/, "").trim();
        if (name.replace(/[^a-zA-Z0-9]/g, "").length < 2) return full;
        const t = targetLine({ num, name });
        if (t == null) return full;
        return `<span class="colly-index-link" data-logo-line="${t}">${full}</span>`;
      },
    );
  }
  return lines.join("\n");
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
