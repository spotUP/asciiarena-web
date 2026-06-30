import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { urlsafe } from "@/lib/utils";

// "Appears with" — the co-signature scene graph. Two entities are connected when
// their logos appear in the same colly. Derived from the colly_logos catalog, no
// extra data needed. Queries select only ids/names (never content_text), so the
// self-join's temp tables stay tiny.

export interface SceneLink {
  id: number;
  name: string;
  url: string;
  shared: number; // distinct collys both appear in
}

interface ArtistRow { id: number; nick: string; artisturl: string | null; shared: bigint }
interface CrewRow { id: number; name: string; shared: bigint }

// Artists whose logos share a colly with this artist, most-shared first.
export async function artistsWith(artistId: number, n = 12): Promise<SceneLink[]> {
  if (!Number.isFinite(artistId)) return [];
  try {
    const rows = await prisma.$queryRaw<ArtistRow[]>(Prisma.sql`
      SELECT o.id AS id, o.nick AS nick, o.artisturl AS artisturl,
             COUNT(DISTINCT a.colly_id) AS shared
      FROM colly_logos a
      JOIN colly_logos b ON b.colly_id = a.colly_id AND b.artist_id <> a.artist_id
      JOIN artists o ON o.id = b.artist_id
      WHERE a.artist_id = ${artistId} AND b.artist_id IS NOT NULL
      GROUP BY o.id, o.nick, o.artisturl
      ORDER BY shared DESC, o.nick ASC
      LIMIT ${n}
    `);
    return rows.map((r) => ({ id: r.id, name: r.nick, url: `/artist/${r.artisturl ?? urlsafe(r.nick)}`, shared: Number(r.shared) }));
  } catch {
    return [];
  }
}

// Crews whose logos share a colly with this crew.
export async function crewsWith(crewId: number, n = 12): Promise<SceneLink[]> {
  if (!Number.isFinite(crewId)) return [];
  try {
    const rows = await prisma.$queryRaw<CrewRow[]>(Prisma.sql`
      SELECT o.id AS id, o.name AS name, COUNT(DISTINCT a.colly_id) AS shared
      FROM colly_logos a
      JOIN colly_logos b ON b.colly_id = a.colly_id AND b.crew_id <> a.crew_id
      JOIN crews o ON o.id = b.crew_id
      WHERE a.crew_id = ${crewId} AND b.crew_id IS NOT NULL
      GROUP BY o.id, o.name
      ORDER BY shared DESC, o.name ASC
      LIMIT ${n}
    `);
    return rows.map((r) => ({ id: r.id, name: r.name, url: `/crew/${urlsafe(r.name)}`, shared: Number(r.shared) }));
  } catch {
    return [];
  }
}

// Top artist collaborations across the whole catalog (pairs sharing the most
// collys). Each unordered pair counted once (a.artist_id < b.artist_id).
export interface ScenePair {
  a: SceneLink;
  b: SceneLink;
  shared: number;
}
interface PairRow {
  a_id: number; a_nick: string; a_url: string | null;
  b_id: number; b_nick: string; b_url: string | null;
  shared: bigint;
}
export async function topCollaborations(n = 15): Promise<ScenePair[]> {
  try {
    const rows = await prisma.$queryRaw<PairRow[]>(Prisma.sql`
      SELECT a.artist_id AS a_id, aa.nick AS a_nick, aa.artisturl AS a_url,
             b.artist_id AS b_id, ab.nick AS b_nick, ab.artisturl AS b_url,
             COUNT(DISTINCT a.colly_id) AS shared
      FROM colly_logos a
      JOIN colly_logos b ON b.colly_id = a.colly_id AND b.artist_id > a.artist_id
      JOIN artists aa ON aa.id = a.artist_id
      JOIN artists ab ON ab.id = b.artist_id
      WHERE a.artist_id IS NOT NULL AND b.artist_id IS NOT NULL
      GROUP BY a.artist_id, b.artist_id, aa.nick, aa.artisturl, ab.nick, ab.artisturl
      ORDER BY shared DESC
      LIMIT ${n}
    `);
    return rows.map((r) => ({
      a: { id: r.a_id, name: r.a_nick, url: `/artist/${r.a_url ?? urlsafe(r.a_nick)}`, shared: Number(r.shared) },
      b: { id: r.b_id, name: r.b_nick, url: `/artist/${r.b_url ?? urlsafe(r.b_nick)}`, shared: Number(r.shared) },
      shared: Number(r.shared),
    }));
  } catch {
    return [];
  }
}
