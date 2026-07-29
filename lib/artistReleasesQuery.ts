import { Prisma } from "@/lib/generated/prisma/client";

// The "All Releases" table on an artist page: one row per release the artist
// is credited on, carrying that release's PRIMARY crew.
//
// "Primary crew" is the collys_crews row with the lowest sortorder. The
// previous version expressed that as
//
//   LEFT JOIN collys_crews cc ON cc.colly_id = c.id
//     AND cc.sortorder = (SELECT MIN(sortorder) FROM collys_crews WHERE colly_id = c.id)
//
// which is NOT a single-row join. `sortorder` has no uniqueness constraint and
// defaults to 0, so a colly credited to two crews that both sit at the minimum
// matches BOTH rows and the release appears twice. se-lapsi.txt (Low Profile
// and Style, both at the same sortorder) is the case that surfaced it.
//
// That mattered far beyond a repeated row: ArtistReleases keys its rows on
// colly_id, so a duplicated colly meant two React children sharing a key. The
// server's first paint looked right, but re-sorting in the browser let the
// reconciler patch the wrong nodes -- rows landed out of order and picked up a
// sibling's crew. Sorting by Release Date was the visible symptom.
//
// Matching on the subquery's `id` instead makes the join single-row by
// construction: the subquery returns one scalar, with sortorder choosing the
// primary crew and id breaking ties deterministically so the same crew is
// picked on every run.
export function buildArtistReleasesQuery(artistId: number): Prisma.Sql {
  return Prisma.sql`
    SELECT ac.colly_id, c.filename, c.name, c.year, c.month, c.day,
           c.filesize, c.uploader, c.view_counter, c.downloads, c.rating,
           w.name AS crew, w.crewurl
    FROM artists_collys ac
    JOIN collys c ON c.id = ac.colly_id
    LEFT JOIN collys_crews cc ON cc.id = (
      SELECT cc2.id
      FROM collys_crews cc2
      WHERE cc2.colly_id = c.id
      ORDER BY cc2.sortorder ASC, cc2.id ASC
      LIMIT 1
    )
    LEFT JOIN crews w ON w.id = cc.crew_id
    WHERE ac.artist_id = ${artistId}
    ORDER BY c.filename ASC
  `;
}
