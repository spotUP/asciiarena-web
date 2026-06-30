import { detectLogoSections, buildLogoIndex } from "@/lib/logoSections";
import { normalizeHandle, resolveEntities, isLikelyLogoLabel, subjectPart, type EntityDicts } from "@/lib/handleMatch";

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

// Turn a colly's plaintext into catalog rows. One row per *captioned* logo —
// uncaptioned / generic "Logo N" fallbacks are skipped (not searchable, just
// noise). Labels only; no colly art is stored.
export function buildLogoRows(collyId: number, text: string, dicts: EntityDicts): LogoRow[] {
  const sections = detectLogoSections(text);
  const index = buildLogoIndex(text, sections);
  const rows: LogoRow[] = [];
  index.forEach((entry, position) => {
    const raw = (entry.label || "").trim();
    if (!raw || /^Logo \d+$/.test(raw)) return; // uncaptioned / generic fallback
    const label = raw.slice(0, 120);
    // The label's SUBJECT (before any "for"/"4" recipient) must look like a real
    // handle — even when it resolves. This drops credits/gifts tables and prose
    // that merely mention a handle ("All work by TANGo except the following...").
    if (!isLikelyLogoLabel(subjectPart(label))) return;
    const res = resolveEntities(label, dicts);
    rows.push({
      colly_id: collyId,
      position,
      start_line: entry.section.startLine,
      label,
      label_norm: normalizeHandle(label).slice(0, 120),
      artist_id: res.artist_id ?? null,
      crew_id: res.crew_id ?? null,
      user_id: res.user_id ?? null,
    });
  });
  return rows;
}
