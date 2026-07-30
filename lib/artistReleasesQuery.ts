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
// A scalar aggregate subquery avoids the fan-out for the same reason a
// LIMIT 1 lookup would -- it yields one value per release -- but without
// throwing away the other crews. Two crews on a colly is ordinary, not an
// anomaly: se-lapsi.txt really is a Style AND Low Profile release, and
// /collys has always listed every crew on a release. Picking one here would
// have quietly disagreed with that page about the same colly.
//
// Fields are separated by 0x1f and records by 0x1e -- non-printable, so a crew
// name containing a comma cannot break the split. Same idiom as the
// GROUP_CONCAT in app/api/messages/route.ts.
export function buildArtistReleasesQuery(artistId: number): Prisma.Sql {
  return Prisma.sql`
    SELECT ac.colly_id, c.filename, c.name, c.year, c.month, c.day,
           c.filesize, c.uploader, c.view_counter, c.downloads, c.rating,
           (SELECT GROUP_CONCAT(CONCAT(w.name, 0x1f, IFNULL(w.crewurl, ''))
                     ORDER BY cc.sortorder ASC, cc.id ASC SEPARATOR 0x1e)
              FROM collys_crews cc
              JOIN crews w ON w.id = cc.crew_id
             WHERE cc.colly_id = c.id) AS crews
    FROM artists_collys ac
    JOIN collys c ON c.id = ac.colly_id
    WHERE ac.artist_id = ${artistId}
    ORDER BY c.filename ASC
  `;
}

export interface ReleaseCrew {
  name: string;
  url: string;
}

/**
 * Decode the `crews` column produced above.
 *
 * Colocated with the SQL that encodes it so the two cannot drift. Order is
 * meaningful: the first entry is the release's primary crew (lowest sortorder),
 * which is what the Crew column sorts on.
 */
export function parseReleaseCrews(concat: string | null): ReleaseCrew[] {
  if (!concat) return [];
  return concat.split("\u001e").flatMap((entry) => {
    const [name, url] = entry.split("\u001f");
    if (!name) return [];
    // crewurl is empty for a handful of legacy rows; fall back to the name so
    // the link still points somewhere sensible rather than /crew/.
    return [{ name, url: url || name }];
  });
}
