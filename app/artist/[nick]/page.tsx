import { notFound } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";

interface PageProps {
  params: Promise<{ nick: string }>;
  searchParams: Promise<{ sort_by?: string }>;
}

const VALID_SORT_COLS = new Set([
  "c.filename",
  "a.nick",
  "w.name",
  "c.year",
  "c.year, c.month",
]);

interface ReleaseRow {
  colly_id: number;
  filename: string;
  name: string | null;
  year: number | null;
  crew: string | null;
  crewurl: string | null;
}

export default async function ArtistPage({ params, searchParams }: PageProps) {
  const { nick } = await params;
  const { sort_by: rawSortBy } = await searchParams;

  const artist = await prisma.artists.findFirst({
    where: { artisturl: nick },
  });
  if (!artist) notFound();

  // Crew memberships
  const memberships = await prisma.member_of.findMany({
    where: { nick: artist.nick },
  });

  // Vote count from comments — count comments with rating > 0 for any colly by this artist
  const artistCollys = await prisma.artists_collys.findMany({
    where: { artist_id: artist.id },
    select: { colly_id: true },
  });
  const collyIds = artistCollys.map((r) => r.colly_id);

  let voteCount = 0;
  if (collyIds.length > 0) {
    voteCount = await prisma.comments.count({
      where: { colly_id: { in: collyIds }, rating: { gt: 0 } },
    });
  }

  const ratingDisplay =
    !artist.rating || artist.rating === 0
      ? `Awaiting ${Math.max(0, 3 - voteCount)} votes`
      : `${artist.rating.toFixed(1)} (${voteCount} votes)`;

  // All releases for this artist via raw SQL for the sort flexibility
  const sortBy = rawSortBy && VALID_SORT_COLS.has(rawSortBy) ? rawSortBy : "c.filename";

  // Fetch releases with crew info
  const releasesRaw = await prisma.$queryRawUnsafe<ReleaseRow[]>(`
    SELECT
      ac.colly_id,
      c.filename,
      c.name,
      c.year,
      w.name AS crew,
      w.crewurl
    FROM artists_collys ac
    JOIN collys c ON c.id = ac.colly_id
    LEFT JOIN collys_crews cc ON cc.colly_id = c.id AND cc.sortorder = (
      SELECT MIN(sortorder) FROM collys_crews WHERE colly_id = c.id
    )
    LEFT JOIN crews w ON w.id = cc.crew_id
    LEFT JOIN artists a ON a.id = ac.artist_id
    WHERE ac.artist_id = ${artist.id}
    ORDER BY ${sortBy} ASC
  `);

  // Latest release is the most recent by year/month
  const latestRelease = releasesRaw.reduce<ReleaseRow | null>((best, r) => {
    if (!best) return r;
    if ((r.year ?? 0) > (best.year ?? 0)) return r;
    return best;
  }, null);

  const acronym = artist.acronym ?? artist.nick;

  return (
    <SiteLayout title="aRTIST iNFO">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">{artist.nick}</h2>
        </div>
      </div>

      <div className="col-lg-12 ps-0">
        <span className="lightgrey">Nick: </span>
        {artist.nick}
      </div>
      <div className="col-lg-12 ps-0">
        <span className="lightgrey">Crew(s): </span>
        {memberships.length > 0
          ? memberships.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                <a href={`/crew/${urlsafe(m.crew ?? "")}`}>{m.crew}</a>
              </span>
            ))
          : "-"}
      </div>
      {artist.www && (
        <div className="col-lg-12 ps-0">
          <span className="lightgrey">Webpage: </span>
          <a href={artist.www} target="_blank" rel="noopener noreferrer">
            {artist.www}
          </a>
        </div>
      )}
      {artist.country && (
        <div className="col-lg-12 ps-0">
          <span className="lightgrey">Country: </span>
          {artist.country}
        </div>
      )}
      <div className="col-lg-12 ps-0">
        <span className="lightgrey">Status: </span>
        {artist.active ?? "-"}
      </div>
      <div className="col-lg-12 ps-0">
        <span className="lightgrey">Rating: </span>
        {ratingDisplay}
      </div>

      {/* Latest Release */}
      {latestRelease && (
        <>
          <div className="row apt-1">
            <h2 className="ap-1 bg-header">Latest Release</h2>
          </div>
          <div className="col-lg-12 ps-0 d-flex justify-content-between">
            <div className="col-lg-4 ps-0">
              <a className="magenta" href={`/release/${latestRelease.filename}`}>
                {latestRelease.filename.slice(0, 20)}
              </a>
            </div>
            <div className="col-lg-4 ps-0">
              {latestRelease.name?.slice(0, 35) ?? "-"}
            </div>
            {latestRelease.crew && latestRelease.crewurl && (
              <div className="col-lg-2 ps-0">
                <a href={`/crew/${latestRelease.crewurl}`}>{latestRelease.crew}</a>
              </div>
            )}
            <div className="col-lg-2 ps-0">
              <span className="lightgrey">{latestRelease.year}</span>
            </div>
          </div>
        </>
      )}

      {/* Sort links */}
      <div className="row apt-1 apb-1">
        <h2 className="bg-header">All {acronym} Releases</h2>
      </div>
      <div className="col-lg-12 d-flex justify-content-between ps-0">
        <a href={`?sort_by=c.filename`}>Filename</a>
        <a href={`?sort_by=a.nick`}>Name</a>
        <a href={`?sort_by=w.name`}>Crew</a>
        <a href={`?sort_by=c.year`}>Release Date</a>
      </div>

      {/* All releases */}
      {releasesRaw.map((r) => (
        <div
          key={r.colly_id}
          className="col-lg-12 d-flex justify-content-between ps-0"
        >
          <div className="col-lg-3 ps-0">
            <a className="magenta" href={`/release/${r.filename}`}>
              {r.filename.slice(0, 12)}
            </a>
          </div>
          <div className="col-lg-3 ps-0">
            <a className="magenta" href={`/release/${r.filename}`}>
              {r.name?.slice(0, 35) ?? r.filename}
            </a>
          </div>
          <div className="col-lg-3 ps-0">
            {r.crew && r.crewurl ? (
              <a href={`/crew/${r.crewurl}`}>{r.crew}</a>
            ) : (
              r.crew ?? "-"
            )}
          </div>
          <div className="col-lg-3 ps-0">
            <span className="lightgrey">{r.year ?? "-"}</span>
          </div>
        </div>
      ))}
    </SiteLayout>
  );
}
