import { prisma } from "@/lib/db";
import type { LogoMapEntry } from "@/lib/logoMapPayload";

// Reading a pre-feature admin map back out of the catalog.
//
// A colly tagged before public tagging existed has its hand-curated map ONLY
// as `colly_logos` rows with manual = 1 -- there is no snapshot, and the file
// trailer never sees admin-editor maps. Two callers need that map back:
//
//   1. GET /api/collys/[id]/logos, to seed the editor with it.
//   2. writeLogoEdit, to snapshot it as a baseline before the first public
//      save deletes those rows.
//
// If those two ever converted differently, the baseline would preserve a map
// that is not the one the tagger was shown -- so both go through here.

interface ManualLogoRow {
  start_line: number;
  end_line: number | null;
  label: string;
}

/**
 * Catalog rows (0-based lines) to map entries (1-based lines, as authored).
 * The inverse of `buildLogoRowsFromMap`'s line conversion.
 */
export function manualRowsToLogoMap(rows: ManualLogoRow[]): LogoMapEntry[] {
  return rows.map((r) => (
    r.end_line != null
      ? { line: r.start_line + 1, end: r.end_line + 1, caption: r.label }
      : { line: r.start_line + 1, caption: r.label }
  ));
}

/** The colly's manual catalog map, in catalog order. Empty when it has none. */
export async function readManualLogoMap(collyId: number): Promise<LogoMapEntry[]> {
  const rows = await prisma.colly_logos.findMany({
    where: { colly_id: collyId, manual: 1 },
    orderBy: { position: "asc" },
    select: { start_line: true, end_line: true, label: true },
  });
  return manualRowsToLogoMap(rows);
}
