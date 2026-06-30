import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { normalizeHandle, cleanLabel } from "@/lib/handleMatch";

export interface CollyLogoHit {
  filename: string;
  name: string | null;
  labels: string[]; // distinct matching logo labels in this colly
  start_line: number; // first matching logo, for scroll-to
}

interface Row {
  filename: string;
  name: string | null;
  label: string;
  start_line: number;
}

function groupByColly(rows: Row[], limit: number): CollyLogoHit[] {
  const byColly = new Map<string, CollyLogoHit>();
  const seen = new Map<string, Set<string>>();
  for (const r of rows) {
    const clean = cleanLabel(r.label);
    if (!clean) continue;
    const key = clean.toLowerCase();
    let hit = byColly.get(r.filename);
    if (!hit) {
      if (byColly.size >= limit) continue;
      hit = { filename: r.filename, name: r.name, labels: [], start_line: r.start_line };
      byColly.set(r.filename, hit);
      seen.set(r.filename, new Set());
    }
    const s = seen.get(r.filename)!;
    if (!s.has(key) && hit.labels.length < 4) {
      s.add(key);
      hit.labels.push(clean);
    }
  }
  return [...byColly.values()];
}

// Collys containing a logo resolved to a given artist / crew / user. Used by the
// entity pages. Defensive: returns [] if the catalog table doesn't exist yet.
export async function logosForEntity(
  kind: "artist" | "crew" | "user",
  id: number,
  limit = 60,
): Promise<CollyLogoHit[]> {
  if (!Number.isFinite(id)) return [];
  const col = kind === "artist" ? Prisma.sql`cl.artist_id` : kind === "crew" ? Prisma.sql`cl.crew_id` : Prisma.sql`cl.user_id`;
  try {
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT c.filename AS filename, c.name AS name, cl.label AS label, cl.start_line AS start_line
      FROM colly_logos cl
      JOIN collys c ON c.id = cl.colly_id
      WHERE ${col} = ${id}
      ORDER BY c.view_counter DESC, cl.start_line ASC
      LIMIT ${limit * 4}
    `);
    return groupByColly(rows, limit);
  } catch {
    return [];
  }
}

// Find collys whose logo labels match the query (a handle / crew / artist name).
// Matches on the normalized label (case/punctuation/space-insensitive), so
// "up rough" finds "uP rOUGH" and "spot" finds it inside "sPOt 4 aSCiiARENa".
// Defensive: returns [] if the catalog table doesn't exist yet (pre-backfill).
export async function searchLogos(q: string, limit = 60): Promise<CollyLogoHit[]> {
  const norm = normalizeHandle(q);
  if (norm.length < 2) return [];
  try {
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT c.filename AS filename, c.name AS name, cl.label AS label, cl.start_line AS start_line
      FROM colly_logos cl
      JOIN collys c ON c.id = cl.colly_id
      WHERE cl.label_norm LIKE ${`%${norm}%`}
      ORDER BY c.view_counter DESC, cl.start_line ASC
      LIMIT ${limit * 4}
    `);
    return groupByColly(rows, limit);
  } catch {
    return [];
  }
}
