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

// Split the text into maximal runs of non-blank lines.
function scanIslands(lines: string[], metas: LineMeta[]): Omit<Island, "fp" | "kind">[] {
  const out: Omit<Island, "fp" | "kind">[] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && metas[i].blank) i++;
    if (i >= lines.length) break;
    const start = i;
    while (i < lines.length && !metas[i].blank) i++;
    const end = i - 1;
    const blockMetas = metas.slice(start, end + 1);
    let left = Infinity;
    let right = -1;
    let maxWidth = 0;
    for (const m of blockMetas) {
      if (m.left >= 0 && m.left < left) left = m.left;
      if (m.right > right) right = m.right;
      if (m.width > maxWidth) maxWidth = m.width;
    }
    out.push({ startLine: start, endLine: end, metas: blockMetas, left: left === Infinity ? 0 : left, right, maxWidth });
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

  const raw = scanIslands(lines, metas);

  // Fingerprint every island; any shape that repeats 2+ times is a divider frame.
  const fpCount = new Map<string, number>();
  const fps = raw.map((isl) => norm(lines[isl.startLine]) + "|" + norm(lines[isl.endLine]));
  fps.forEach((fp) => fpCount.set(fp, (fpCount.get(fp) ?? 0) + 1));

  const islands: Island[] = raw.map((isl, n) => {
    const fp = fps[n];
    const everyLineFrame = isl.metas.every((m) => m.distinct <= 2);
    // Repeating shapes and pure frames are dividers; everything else is a logo
    // candidate. Short narrow text labels are not special-cased here — they fail
    // the width/height gate below, which is the single place that decision lives.
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

  // Collapse spaced-letter sequences: "s u b l i m e" -> "sublime"
  const compact = (s: string) => {
    s = s.replace(/ {2,}/g, " ");
    let prev: string;
    do {
      prev = s;
      s = s.replace(/([a-zA-Z0-9_]) ([a-zA-Z0-9_])/g, "$1$2");
    } while (s !== prev);
    return s.trim();
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

// Pure geometry for centring a logo's ink box vertically in the viewport.
// Extracted so it can be unit-tested without a DOM.
export function computeScrollTarget(
  s: Pick<LogoSection, "inkTop" | "inkBottom">,
  o: { spacers: number; lineHeight: number; viewH: number; maxScroll: number },
): number {
  const boxTop = (o.spacers + s.inkTop) * o.lineHeight;
  const boxH = (s.inkBottom - s.inkTop + 1) * o.lineHeight;
  return Math.max(0, Math.min(boxTop - (o.viewH - boxH) / 2, o.maxScroll));
}
