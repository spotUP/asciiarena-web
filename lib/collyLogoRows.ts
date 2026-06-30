import { detectLogoSections, buildLogoIndex } from "@/lib/logoSections";
import { resolveEntities, isLikelyLogoLabel, subjectPart, searchKey, type EntityDicts } from "@/lib/handleMatch";

// Pure (no DB) so it's unit-testable. Kept separate from collyLogoIndex.ts,
// which imports the Prisma client.

export interface LogoRow {
  colly_id: number;
  position: number;
  start_line: number;
  label: string;
  label_norm: string;
  artist_id: number | null;
  crew_id: number | null;
  user_id: number | null;
}

// Build one catalog row from a single caption, or null if it's not a real logo
// label. Shared by detection (buildLogoRows) and the explicit map (buildLogoRowsFromMap).
function buildLogoRow(collyId: number, rawLabel: string, position: number, startLine: number, dicts: EntityDicts): LogoRow | null {
  const raw = (rawLabel || "").trim();
  if (!raw || /^Logo \d+$/.test(raw)) return null; // uncaptioned / generic fallback
  const label = raw.slice(0, 120);
  const subject = subjectPart(label);
  // The label's SUBJECT (before any "for"/"4" recipient) must look like a real
  // handle — even when it resolves. This drops credits/gifts tables and prose
  // that merely mention a handle ("All work by TANGo except the following...").
  if (!isLikelyLogoLabel(subject)) return null;
  const res = resolveEntities(label, dicts);
  return {
    colly_id: collyId,
    position,
    start_line: startLine,
    label,
    // Whole-token search key for the SUBJECT only: searching "spot" matches the
    // handle "spot" but not "spotlite" (substring) nor an "up rough FOR spot"
    // recipient.
    label_norm: searchKey(subject).slice(0, 120),
    artist_id: res.artist_id ?? null,
    crew_id: res.crew_id ?? null,
    user_id: res.user_id ?? null,
  };
}

// Turn a colly's plaintext into catalog rows. One row per *captioned* logo —
// uncaptioned / generic "Logo N" fallbacks are skipped (not searchable, just
// noise). Labels only; no colly art is stored.
export function buildLogoRows(collyId: number, text: string, dicts: EntityDicts): LogoRow[] {
  const sections = detectLogoSections(text);
  const index = buildLogoIndex(text, sections);
  const rows: LogoRow[] = [];
  index.forEach((entry, position) => {
    const row = buildLogoRow(collyId, entry.label, position, entry.section.startLine, dicts);
    if (row) rows.push(row);
  });
  return rows;
}

// Rows from an artist-provided logo map (tagged collys) — the captions are the
// artist's exact names, so search is precise even when the art is too wild for
// detection. Lines are 1-based as authored; stored start_line is 0-based.
export function buildLogoRowsFromMap(
  collyId: number,
  logos: { line: number; end?: number; caption: string }[],
  dicts: EntityDicts,
): LogoRow[] {
  const sorted = [...logos].sort((a, b) => a.line - b.line);
  const rows: LogoRow[] = [];
  sorted.forEach((lg, position) => {
    const row = buildLogoRow(collyId, lg.caption, position, Math.max(0, lg.line - 1), dicts);
    if (row) rows.push(row);
  });
  return rows;
}
