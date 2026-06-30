// Logo section detection for multi-logo ASCII collys.
//
// A colly is a stack of ASCII art logos separated by blank lines, often with
// repeating divider frames and short text captions/labels between them. This
// module locates the actual logos so the release viewer can build a jump index
// and autoplay can scroll each logo to the centre of the viewport.
//
// The headline output for centring is the *ink box* (inkTop..inkBottom): the
// first and last rows that actually carry art, trimmed of sparse caption/edge
// lines. startLine..endLine remain the full block (used for labels and the
// autoplay hold duration).

export interface LogoSection {
  startLine: number; // first row of the block (raw line index) — labels / hold timing
  endLine: number; // last row of the block (inclusive)
  lineCount: number; // endLine - startLine + 1
  inkTop: number; // first ART row — centring top
  inkBottom: number; // last ART row — centring bottom
}

export interface LogoIndexEntry {
  section: LogoSection;
  label: string;
}

function decodeEntities(html: string): string {
  return html.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

interface LineMeta {
  ink: number; // count of non-space chars
  left: number; // column of first non-space (-1 if blank)
  right: number; // column of last non-space (-1 if blank)
  width: number; // right + 1 (0 if blank)
  distinct: number; // distinct non-space chars
  blank: boolean;
}

function lineMeta(line: string): LineMeta {
  let ink = 0;
  let left = -1;
  let right = -1;
  const set = new Set<string>();
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c !== " " && c !== "\t") {
      ink++;
      if (left === -1) left = i;
      right = i;
      set.add(c);
    }
  }
  return { ink, left, right, width: right + 1, distinct: set.size, blank: ink === 0 };
}

// Normalize a line to its shape: every non-space char becomes '#'. Two lines
// with the same frame art share a fingerprint regardless of interior text.
const norm = (s: string) => s.replace(/\S/g, "#").trimEnd();

type IslandKind = "logo" | "divider";

interface Island {
  startLine: number;
  endLine: number;
  metas: LineMeta[];
  left: number; // min ink column across the block
  right: number; // max ink column across the block
  maxWidth: number;
  fp: string;
  kind: IslandKind;
}

type RawIsland = Omit<Island, "fp" | "kind">;

function islandFromRange(metas: LineMeta[], start: number, end: number): RawIsland {
  const blockMetas = metas.slice(start, end + 1);
  let left = Infinity;
  let right = -1;
  let maxWidth = 0;
  for (const m of blockMetas) {
    if (m.left >= 0 && m.left < left) left = m.left;
    if (m.right > right) right = m.right;
    if (m.width > maxWidth) maxWidth = m.width;
  }
  return { startLine: start, endLine: end, metas: blockMetas, left: left === Infinity ? 0 : left, right, maxWidth };
}

// Split the text into maximal runs of non-blank lines.
function scanIslands(metas: LineMeta[]): RawIsland[] {
  const out: RawIsland[] = [];
  let i = 0;
  while (i < metas.length) {
    while (i < metas.length && metas[i].blank) i++;
    if (i >= metas.length) break;
    const start = i;
    while (i < metas.length && !metas[i].blank) i++;
    out.push(islandFromRange(metas, start, i - 1));
  }
  return out;
}

// Horizontal overlap between two islands, as a fraction of the narrower span.
// Used to decide whether a one-blank-line gap splits a single logo (overlap)
// or separates two distinct logos (no overlap).
function overlapFraction(a: { left: number; right: number }, b: { left: number; right: number }): number {
  const spanA = a.right - a.left + 1;
  const spanB = b.right - b.left + 1;
  if (spanA <= 0 || spanB <= 0) return 0;
  const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) + 1;
  if (overlap <= 0) return 0;
  return overlap / Math.min(spanA, spanB);
}

export function detectLogoSections(html: string): LogoSection[] {
  const text = decodeEntities(html);
  const lines = text.split("\n");
  const metas = lines.map(lineMeta);
  const pageWidth = metas.reduce((m, x) => Math.max(m, x.width), 0) || 1;

  // A divider frame recurs *between* logos, so its line shapes show up in many
  // separate islands (interior text varies but `norm` flattens it); logo art
  // lines are unique. Count how many distinct islands each shape appears in —
  // not raw occurrences, so a logo with an internally-repeated row isn't
  // mistaken for a divider. A shape present in >=3 islands is a divider row,
  // even when the divider is glued to a logo with no blank line (which is why
  // fingerprinting the island as a whole missed it: the logo's varying line
  // made the fingerprint unique).
  // Structural signature is tolerant to horizontal position and whitespace runs
  // so a divider frame still matches across occurrences even when it shifts
  // sideways or its rule rows flex in length to fit different interior text.
  const structSig = (s: string) => s.trim().replace(/\s+/g, " ").replace(/\S/g, "#");
  const shapes = lines.map((l, i) => (metas[i].blank ? "" : structSig(l)));
  const rawAll = scanIslands(metas);
  const shapeIslandCount = new Map<string, number>();
  for (const isl of rawAll) {
    const seen = new Set<string>();
    for (let r = isl.startLine; r <= isl.endLine; r++) {
      const sh = shapes[r];
      if (sh && !seen.has(sh)) {
        seen.add(sh);
        shapeIslandCount.set(sh, (shapeIslandCount.get(sh) ?? 0) + 1);
      }
    }
  }
  const STRUCT_MIN = 3;
  const structural = shapes.map((sh) => sh !== "" && (shapeIslandCount.get(sh) ?? 0) >= STRUCT_MIN);

  // Classify each island by how much of it is repeating divider-frame rows:
  //  - Mostly frame (>= half the rows): it's a divider, even when its interior
  //    caption/counter text varies between occurrences (so those interior rows
  //    aren't structural). Drop it whole — edge-trimming would leave the varying
  //    caption behind as a false logo (the bug with framed "name boxes").
  //  - Some frame at the edges only: a divider glued to a real logo. Edge-trim
  //    the frame rows and keep the art (this preserves textured logos with
  //    internal repeats, which edge-trimming leaves untouched).
  const raw: RawIsland[] = [];
  for (const isl of rawAll) {
    const lc = isl.endLine - isl.startLine + 1;
    let structCount = 0;
    for (let r = isl.startLine; r <= isl.endLine; r++) if (structural[r]) structCount++;
    if (structCount * 2 >= lc) continue; // majority frame -> whole block is a divider
    let s = isl.startLine;
    let e = isl.endLine;
    while (s <= e && structural[s]) s++;
    while (e >= s && structural[e]) e--;
    if (s <= e) raw.push(islandFromRange(metas, s, e));
  }

  // Fingerprint remaining islands; any that still repeats 2+ times (a divider
  // that appears only twice, below STRUCT_MIN, and is blank-separated) is a divider.
  const fpCount = new Map<string, number>();
  const fps = raw.map((isl) => norm(lines[isl.startLine]) + "|" + norm(lines[isl.endLine]));
  fps.forEach((fp) => fpCount.set(fp, (fpCount.get(fp) ?? 0) + 1));

  const islands: Island[] = raw.map((isl, n) => {
    const fp = fps[n];
    const everyLineFrame = isl.metas.every((m) => m.distinct <= 2);
    const kind: IslandKind = (fpCount.get(fp) ?? 0) >= 2 || everyLineFrame ? "divider" : "logo";
    return { ...isl, fp, kind };
  });

  // Keep real logos: the original height gate, OR a smaller block that is wide
  // enough to be art (>=3 lines). Single/double-line fragments are noise.
  const logos = islands.filter((isl) => {
    if (isl.kind !== "logo") return false;
    const lc = isl.endLine - isl.startLine + 1;
    return lc >= 5 || (lc >= 3 && isl.maxWidth >= 0.5 * pageWidth);
  });

  // Merge a logo split by a single internal blank line back into one block,
  // but only when the two halves share columns (same art, not two logos that
  // merely sit one line apart).
  const merged: Island[] = [];
  for (const isl of logos) {
    const prev = merged[merged.length - 1];
    if (prev && isl.startLine - prev.endLine - 1 === 1 && overlapFraction(prev, isl) >= 0.3) {
      prev.endLine = isl.endLine;
      // Recompute the merged block's metas straight from the line range (this
      // now spans the internal blank gap that originally split the logo).
      prev.metas = metas.slice(prev.startLine, prev.endLine + 1);
      prev.left = Math.min(prev.left, isl.left);
      prev.right = Math.max(prev.right, isl.right);
      prev.maxWidth = Math.max(prev.maxWidth, isl.maxWidth);
    } else {
      merged.push({ ...isl });
    }
  }

  return merged.map((isl) => {
    const lineCount = isl.endLine - isl.startLine + 1;
    // Ink box: first/last row that spans a real fraction of the logo's width.
    // Trimming by width (not ink count) drops narrow edge rows — captions,
    // signatures, single-char tails — so centring tracks the art band itself.
    const artWidth = 0.35 * isl.maxWidth;
    let inkTop = -1;
    let inkBottom = -1;
    for (let r = 0; r < isl.metas.length; r++) {
      const m = isl.metas[r];
      if (m.ink > 0 && m.width >= artWidth) {
        if (inkTop === -1) inkTop = isl.startLine + r;
        inkBottom = isl.startLine + r;
      }
    }
    if (inkTop === -1) {
      inkTop = isl.startLine;
      inkBottom = isl.endLine;
    }
    return { startLine: isl.startLine, endLine: isl.endLine, lineCount, inkTop, inkBottom };
  });
}

// Frame lines use <=2 distinct non-space chars (e.g. "mmMMMMMMMmm" = {m,M}).
// Content lines have >=3 distinct non-space chars.
export function extractDividerLabel(divLines: string[]): string {
  const contentLines = divLines.filter((l) => {
    const nonSpace = l.replace(/\s/g, "");
    return nonSpace.length >= 2 && new Set(nonSpace).size >= 3;
  });
  if (!contentLines.length) return "";

  // Collapse spaced-LETTER sequences ("s u b l i m e" -> "sublime") while
  // KEEPING the spaces between real words ("spot 4 asciiarena" stays readable).
  // Only consecutive single-character tokens are merged.
  const compact = (s: string) => {
    const parts = s.replace(/\s{2,}/g, " ").trim().split(" ").filter(Boolean);
    const out: string[] = [];
    let buf = "";
    for (const p of parts) {
      if (p.length === 1) {
        buf += p; // accumulate a run of spaced single chars
      } else {
        if (buf) { out.push(buf); buf = ""; }
        out.push(p);
      }
    }
    if (buf) out.push(buf);
    return out.join(" ").trim();
  };
  const strip = (s: string) => s.replace(/^[^a-zA-Z0-9]+/, "").replace(/[^a-zA-Z0-9]+$/, "").trim();

  // Prefer colon lines: "logo_name : sublime" or "|: ..domination.. :|"
  for (const line of contentLines) {
    let idx = -1;
    while ((idx = line.indexOf(":", idx + 1)) >= 0) {
      const label = compact(strip(line.slice(idx + 1)));
      if (label.replace(/[^a-zA-Z]/g, "").length >= 2) return label.slice(0, 36);
    }
  }

  // Fallback: first content line with actual letters
  for (const line of contentLines) {
    const label = compact(strip(line));
    if (label.replace(/[^a-zA-Z]/g, "").length >= 2) return label.slice(0, 36);
  }
  return "";
}

export function buildLogoIndex(html: string, sections: LogoSection[]): LogoIndexEntry[] {
  if (!sections.length) return [];
  const text = decodeEntities(html);
  const lines = text.split("\n");

  interface RawIsland {
    startLine: number;
    endLine: number;
  }
  const all: RawIsland[] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    const start = i;
    while (i < lines.length && lines[i].trim() !== "") i++;
    all.push({ startLine: start, endLine: i - 1 });
  }

  return sections.map((section, n) => {
    const preceding = all.filter((isl) => isl.endLine < section.startLine).sort((a, b) => b.endLine - a.endLine)[0];
    let label = "";
    if (preceding) label = extractDividerLabel(lines.slice(preceding.startLine, preceding.endLine + 1));
    return { section, label: label || `Logo ${n + 1}` };
  });
}

// Ping-pong index stepping for looping autoplay: advance by dir, reversing at
// either end so it bounces forward-then-backward forever. Returns the next
// index and the (possibly flipped) direction.
export function pingPongNext(i: number, dir: number, n: number): { index: number; dir: number } {
  if (n <= 1) return { index: 0, dir };
  let d = dir;
  let next = i + d;
  if (next >= n) { d = -1; next = i - 1; }
  else if (next < 0) { d = 1; next = i + 1; }
  return { index: Math.max(0, Math.min(next, n - 1)), dir: d };
}

// Pure geometry for centring a logo's ink box vertically in the viewport.
// Extracted so it can be unit-tested without a DOM.
//
// originTop is the scroll-content Y of the <pre>'s top. In fullscreen the <pre>
// is absolutely positioned inside a positioned ancestor, so its content does
// NOT start at scroll origin 0 — measuring it (vs assuming 0) is what keeps
// logos centred instead of landing low on the screen.
export function computeScrollTarget(
  s: Pick<LogoSection, "inkTop" | "inkBottom">,
  o: { spacers: number; lineHeight: number; viewH: number; maxScroll: number; originTop?: number },
): number {
  const boxTop = (o.originTop ?? 0) + (o.spacers + s.inkTop) * o.lineHeight;
  const boxH = (s.inkBottom - s.inkTop + 1) * o.lineHeight;
  return Math.max(0, Math.min(boxTop - (o.viewH - boxH) / 2, o.maxScroll));
}
