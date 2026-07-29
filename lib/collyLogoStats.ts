import { prisma } from "@/lib/db";
import { buildMostDrawnArtistsQuery, buildMostDrawnCrewsQuery } from "@/lib/mostDrawnQueries";

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
    return shape(await prisma.$queryRaw<RawRow[]>(buildMostDrawnArtistsQuery(n)));
  } catch {
    return [];
  }
}


// Crews with the most resolved logos in the catalog.
export async function mostDrawnCrews(n: number): Promise<DrawnStat[]> {
  try {
    return shape(await prisma.$queryRaw<RawRow[]>(buildMostDrawnCrewsQuery(n)));
  } catch {
    return [];
  }
}

