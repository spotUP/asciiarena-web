import { Prisma } from "@/lib/generated/prisma/client";

// Ranking for the TOP TAGGERS widget.
//
// Only the NEWEST snapshot per colly counts, because that snapshot IS the
// colly's current map. Summing every snapshot would reward re-saving the same
// colly over and over, and would credit maps that have since been replaced.
//
// Deliberately excluded from the sum:
//   - user_id 0, the synthetic author of the baseline snapshot taken before a
//     colly's first public overwrite. Nobody tagged that; it is preserved
//     history, not work.
//   - snapshots with logo_count 0, so clearing a colly's map cannot be farmed
//     for a place on the board.
//
// The `map` MEDIUMTEXT column is never selected or sorted on. That matters:
// this server has previously had InnoDB temp space blow up and fill the disk
// from a query that big-sorted a MEDIUMTEXT column.
export function buildTopTaggersQuery(limit: number): Prisma.Sql {
  return Prisma.sql`
    SELECT e.user_id            AS user_id,
           u.nick               AS nick,
           SUM(e.logo_count)    AS logos,
           COUNT(*)             AS collys
    FROM colly_logo_edits e
    JOIN (
      SELECT colly_id, MAX(id) AS id
      FROM colly_logo_edits
      GROUP BY colly_id
    ) newest ON newest.id = e.id
    JOIN users u ON u.id = e.user_id
    WHERE e.user_id > 0 AND e.logo_count > 0
    GROUP BY e.user_id, u.nick
    ORDER BY logos DESC, collys DESC, u.nick ASC
    LIMIT ${limit}
  `;
}
