import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

// Export the logo catalog as a labelled dataset for training/evaluating a logo
// detector. Each manual (artist/admin-mapped) row is a GOLD example: a verified
// (line-range -> caption -> entity) label over the colly text. Detected rows can
// be included as weak labels. The actual model training happens offline on this
// export; asciiarena just produces the dataset.

export interface TrainingRecord {
  filename: string;
  type: string | null;
  start_line: number;
  end_line: number | null;
  label: string;
  manual: boolean;
  entity: { kind: "artist" | "crew" | "user"; id: number } | null;
  lines: string[]; // the logo's text lines, sliced from content_text
}

interface Row {
  filename: string;
  type: string | null;
  start_line: number;
  end_line: number | null;
  label: string;
  manual: number;
  artist_id: number | null;
  crew_id: number | null;
  user_id: number | null;
  content_text: string | null;
}

const FALLBACK_WINDOW = 11;

function sliceLines(content: string, start0: number, end0: number | null): string[] {
  const lines = content.split(/\r?\n/);
  const end = end0 != null && end0 >= start0 ? end0 : start0 + FALLBACK_WINDOW;
  return lines.slice(start0, end + 1);
}

// Stream-friendly: returns the labelled records. `manualOnly` (default) yields
// only human-verified gold labels — few rows, cheap. Set false to also include
// detected (weak) labels. No ORDER BY on content_text, so no temp-table blowup.
export async function exportTrainingData(manualOnly = true, limit = 5000): Promise<TrainingRecord[]> {
  const where = manualOnly ? Prisma.sql`cl.manual = 1` : Prisma.sql`1 = 1`;
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT c.filename AS filename, c.type AS type, cl.start_line AS start_line,
           cl.end_line AS end_line, cl.label AS label, cl.manual AS manual,
           cl.artist_id AS artist_id, cl.crew_id AS crew_id, cl.user_id AS user_id,
           c.content_text AS content_text
    FROM colly_logos cl
    JOIN collys c ON c.id = cl.colly_id
    WHERE ${where} AND c.content_text IS NOT NULL
    LIMIT ${limit}
  `);
  return rows.map((r) => ({
    filename: r.filename,
    type: r.type,
    start_line: r.start_line,
    end_line: r.end_line,
    label: r.label,
    manual: r.manual === 1,
    entity: r.artist_id
      ? { kind: "artist", id: r.artist_id }
      : r.crew_id
      ? { kind: "crew", id: r.crew_id }
      : r.user_id
      ? { kind: "user", id: r.user_id }
      : null,
    lines: sliceLines(r.content_text ?? "", r.start_line, r.end_line),
  }));
}

// Serialise as JSON Lines (one record per line) — the canonical training format.
export function toJsonl(records: TrainingRecord[]): string {
  return records.map((r) => JSON.stringify(r)).join("\n");
}
