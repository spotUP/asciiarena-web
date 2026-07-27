import { logoMapSchema, type LogoMapEntry } from "@/lib/logoMapPayload";

// Read/write for the `colly_logo_edits.map` column. Pure, so the storage
// format is testable without a database.

/** Canonical JSON for a map: sorted by line, `end` omitted when absent. */
export function serializeLogoMap(map: LogoMapEntry[]): string {
  const sorted = [...map].sort((a, b) => a.line - b.line);
  return JSON.stringify(sorted.map((e) => (
    e.end === undefined ? { line: e.line, caption: e.caption } : { line: e.line, end: e.end, caption: e.caption }
  )));
}

/**
 * Map stored in a snapshot row. Returns an empty map for anything unreadable —
 * a malformed historical row must never break the release page that reads it.
 */
export function parseLogoMap(json: string): LogoMapEntry[] {
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return []; }
  const parsed = logoMapSchema.safeParse(raw);
  if (!parsed.success) return [];
  return [...parsed.data].sort((a, b) => a.line - b.line);
}

/** Entries the user mapped. The catalog may keep fewer (uncaptioned ones). */
export function logoCountOf(map: LogoMapEntry[]): number {
  return map.length;
}
