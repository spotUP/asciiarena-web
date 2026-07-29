import { Prisma } from "@/lib/generated/prisma/client";

// Grouped by (id, nick, artisturl) this took 340ms, because the two string
// columns exist only to be selected. Grouping on artist_id and joining artists
// once the LIMIT has cut the set to n is 107ms, and returns identical rows
// (verified against the top 25 on prod).
//
// The artists join stays INSIDE the aggregation. 61 colly_logos rows point at 2
// artist ids that no longer exist; the original dropped them via its inner
// join, and filtering only after the LIMIT would let an orphan take a top-n slot
// and then disappear, returning fewer rows than asked for.
export function buildMostDrawnArtistsQuery(n: number): Prisma.Sql {
  return Prisma.sql`
        SELECT p.id AS id, a.nick AS name, a.artisturl AS url,
               p.logos AS logos, p.collys AS collys
        FROM (
          SELECT cl.artist_id AS id,
                 COUNT(*) AS logos, COUNT(DISTINCT cl.colly_id) AS collys
          FROM colly_logos cl
          JOIN artists a2 ON a2.id = cl.artist_id
          GROUP BY cl.artist_id
          ORDER BY logos DESC
          LIMIT ${n}
        ) p
        JOIN artists a ON a.id = p.id
        ORDER BY p.logos DESC
  `;
}

// Same rewrite as mostDrawnArtists: 267ms to 44ms, identical rows. 49 rows
// point at 1 crew id that no longer exists, so the crews join stays inside the
// aggregation for the same reason.
export function buildMostDrawnCrewsQuery(n: number): Prisma.Sql {
  return Prisma.sql`
        SELECT p.id AS id, w.name AS name, w.name AS url,
               p.logos AS logos, p.collys AS collys
        FROM (
          SELECT cl.crew_id AS id,
                 COUNT(*) AS logos, COUNT(DISTINCT cl.colly_id) AS collys
          FROM colly_logos cl
          JOIN crews w2 ON w2.id = cl.crew_id
          GROUP BY cl.crew_id
          ORDER BY logos DESC
          LIMIT ${n}
        ) p
        JOIN crews w ON w.id = p.id
        ORDER BY p.logos DESC
  `;
}
