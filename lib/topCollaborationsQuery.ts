import { Prisma } from "@/lib/generated/prisma/client";

// Unlike artistsWith/crewsWith, this one is not scoped to a single entity, so
// the self-join runs over the whole catalog. Written the obvious way it was the
// slowest query on the site by a wide margin -- 5.4s cold, 1.7s warm, against
// 10-350ms for everything else on /stats.
//
// Two things made it slow, both fixed below.
//
// colly_logos has 103k rows but only 22k carry an artist_id, and an artist
// commonly has MANY logos in the same colly (the worst has 119). The join
// therefore paired every logo with every other logo in its colly and leaned on
// COUNT(DISTINCT colly_id) to collapse the duplication afterwards -- so the
// expensive part existed only to be thrown away. Reducing to DISTINCT
// (colly_id, artist_id) BEFORE the self-join makes each pair appear once, and
// COUNT(*) is then already the number of shared collys.
//
// It also grouped by six columns including four strings, purely so the artists'
// names could be selected. Grouping on the two ids and joining artists once the
// LIMIT has cut the set to n does the same work on a fraction of the data.
//
// The artists join stays INSIDE the aggregation. 61 colly_logos rows point at 2
// artist ids that no longer exist, and the original query dropped them by
// virtue of its inner join; filtering only after the LIMIT would let an orphan
// occupy a top-n slot and then vanish, returning fewer rows than asked for.
// Verified equivalent on the full result set: 24442 pairs, sum(shared) 56867,
// identical both ways.
export function buildTopCollaborationsQuery(n: number): Prisma.Sql {
  return Prisma.sql`
      WITH ca AS (
        SELECT DISTINCT cl.colly_id AS colly_id, cl.artist_id AS artist_id
        FROM colly_logos cl
        JOIN artists a ON a.id = cl.artist_id
      )
      SELECT p.a_id AS a_id, aa.nick AS a_nick, aa.artisturl AS a_url,
             p.b_id AS b_id, ab.nick AS b_nick, ab.artisturl AS b_url,
             p.shared AS shared
      FROM (
        SELECT a.artist_id AS a_id, b.artist_id AS b_id, COUNT(*) AS shared
        FROM ca a
        JOIN ca b ON b.colly_id = a.colly_id AND b.artist_id > a.artist_id
        GROUP BY a.artist_id, b.artist_id
        ORDER BY shared DESC
        LIMIT ${n}
      ) p
      JOIN artists aa ON aa.id = p.a_id
      JOIN artists ab ON ab.id = p.b_id
      ORDER BY p.shared DESC
  `;
}
