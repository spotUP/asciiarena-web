import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export interface DrawnStat {
  id: number;
  name: string;
  url: string; // route slug (artist: artisturl; crew: urlsafe(name) derived in the page)
  logos: number; // resolved logos attributed to this entity
  collys: number; // distinct collys they appear in
}

interface RawRow {
  id: number;
  name: string;
  url: string;
  logos: bigint;
  collys: bigint;
}

const shape = (rows: RawRow[]): DrawnStat[] =>
  rows.map((r) => ({ id: r.id, name: r.name, url: r.url ?? "", logos: Number(r.logos), collys: Number(r.collys) }));

// Artists with the most resolved logos in the catalog. Defensive: [] if the
// catalog table doesn't exist yet.
export async function mostDrawnArtists(n: number): Promise<DrawnStat[]> {
  try {
    return shape(
      await prisma.$queryRaw<RawRow[]>(Prisma.sql`
        SELECT a.id AS id, a.nick AS name, a.artisturl AS url,
               COUNT(*) AS logos, COUNT(DISTINCT cl.colly_id) AS collys
        FROM colly_logos cl
        JOIN artists a ON a.id = cl.artist_id
        WHERE cl.artist_id IS NOT NULL
        GROUP BY a.id, a.nick, a.artisturl
        ORDER BY logos DESC
        LIMIT ${n}
      `),
    );
  } catch {
    return [];
  }
}

// Crews with the most resolved logos in the catalog.
export async function mostDrawnCrews(n: number): Promise<DrawnStat[]> {
  try {
    return shape(
      await prisma.$queryRaw<RawRow[]>(Prisma.sql`
        SELECT w.id AS id, w.name AS name, w.name AS url,
               COUNT(*) AS logos, COUNT(DISTINCT cl.colly_id) AS collys
        FROM colly_logos cl
        JOIN crews w ON w.id = cl.crew_id
        WHERE cl.crew_id IS NOT NULL
        GROUP BY w.id, w.name
        ORDER BY logos DESC
        LIMIT ${n}
      `),
    );
  } catch {
    return [];
  }
}
