import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSession as auth } from "@/lib/session";
import { urlsafe, decodeParam } from "@/lib/utils";
import ClaimArtistButton from "./ClaimArtistButton";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import WatchingPip from "@/components/widgets/WatchingPip";

interface PageProps {
  params: Promise<{ nick: string }>;
  searchParams: Promise<{ sort_by?: string }>;
}

const VALID_SORT_COLS = new Set([
  "c.filename",
  "c.name",
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

interface HandleRow {
  nick: string;
  artisturl: string;
}

function formatJoined(ts: string | null): string {
  if (!ts) return "Unknown";
  const d = new Date(Number(ts) * 1000);
  return d.toISOString().slice(0, 10);
}

export async function generateMetadata({ params }: { params: Promise<{ nick: string }> }): Promise<Metadata> {
  const { nick: rawNick } = await params;
  const nick = decodeParam(rawNick);
  const artist = await prisma.artists.findFirst({ where: { artisturl: nick } });
  if (!artist) return {};

  const [memberships, releaseCount] = await Promise.all([
    prisma.member_of.findMany({ where: { nick: artist.nick } }),
    prisma.artists_collys.count({ where: { artist_id: artist.id } }),
  ]);
  const crewNames = memberships.map(m => m.crew).filter(Boolean).join(", ");
  const description = `ASCII artist ${artist.nick}${crewNames ? ` (${crewNames})` : ""} - ${releaseCount} release${releaseCount !== 1 ? "s" : ""} on aSCIIaRENA`;

  return {
    title: `${artist.nick} - ASCII artist | aSCIIaRENA`,
    description,
    openGraph: { title: `${artist.nick} - ASCII artist | aSCIIaRENA`, url: `/artist/${nick}` },
  };
}

export default async function ArtistPage({ params, searchParams }: PageProps) {
  const { nick: rawNick } = await params;
  const nick = decodeParam(rawNick);
  const { sort_by: rawSortBy } = await searchParams;

  const [session, artist] = await Promise.all([
    auth(),
    prisma.artists.findFirst({
      where: { artisturl: nick },
      include: { users: { select: { nickurl: true, nick: true, joined: true } } },
    }),
  ]);
  if (!artist) notFound();

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const isUnclaimed = artist.user_id === null;
  const canClaim = !!userId && isUnclaimed;

  // Map validated sort keys to safe Prisma.sql fragments — never interpolates user input.
  //
  // Two corrections vs. the obvious "ORDER BY c.name":
  //   1. COALESCE with c.filename for c.name (and likewise route the empty
  //      crew through "IS NULL" first) so NULL columns don't quietly cluster
  //      at the top under default ASC NULLS-first behaviour.
  //   2. LOWER() so the sort is case-insensitive — without it uppercase
  //      filenames like "R21-AAP.ZIP" sort before lowercase ones like
  //      "asc-w46.txt" (ASCII 'R' is 82, 'a' is 97) and the result looks
  //      random to a human reader.
  // TRIM-around-LOWER is essential: at least one row in the wild has a
  // leading space in c.filename (which CSS collapses in the render but
  // SQL sorts as ASCII 32 → that row always bubbles to position 1).
  // Same defensive trimming on c.name and w.name so any leading
  // whitespace doesn't poison the comparison.
  const SORT_SQL: Record<string, Prisma.Sql> = {
    "c.filename":       Prisma.sql`LOWER(TRIM(c.filename))`,
    "c.name":           Prisma.sql`LOWER(TRIM(CASE WHEN c.name IS NULL OR LENGTH(TRIM(c.name)) = 0 THEN c.filename ELSE c.name END))`,
    "w.name":           Prisma.sql`(w.name IS NULL OR LENGTH(TRIM(w.name)) = 0), LOWER(TRIM(w.name))`,
    "c.year":           Prisma.sql`c.year`,
    "c.year, c.month":  Prisma.sql`c.year, c.month`,
  };
  const sortSql = (rawSortBy && SORT_SQL[rawSortBy]) ?? Prisma.sql`c.filename`;

  const [memberships, artistCollys, releasesRaw, otherHandles] = await Promise.all([
    prisma.member_of.findMany({ where: { nick: artist.nick } }),
    prisma.artists_collys.findMany({ where: { artist_id: artist.id }, select: { colly_id: true } }),
    prisma.$queryRaw<ReleaseRow[]>`
      SELECT ac.colly_id, c.filename, c.name, c.year, w.name AS crew, w.crewurl
      FROM artists_collys ac
      JOIN collys c ON c.id = ac.colly_id
      LEFT JOIN collys_crews cc ON cc.colly_id = c.id AND cc.sortorder = (
        SELECT MIN(sortorder) FROM collys_crews WHERE colly_id = c.id
      )
      LEFT JOIN crews w ON w.id = cc.crew_id
      LEFT JOIN artists a ON a.id = ac.artist_id
      WHERE ac.artist_id = ${artist.id}
      ORDER BY ${sortSql} ASC
    `,
    artist.user_id !== null
      ? prisma.$queryRaw<HandleRow[]>`
          SELECT nick, artisturl FROM artists
          WHERE user_id = ${artist.user_id} AND id != ${artist.id}
          ORDER BY nick ASC
        `
      : Promise.resolve([] as HandleRow[]),
  ]);

  const collyIds = artistCollys.map((r) => r.colly_id);
  const voteCount = collyIds.length > 0
    ? await prisma.comments.count({ where: { colly_id: { in: collyIds }, rating: { gt: 0 } } })
    : 0;

  const ratingDisplay =
    !artist.rating || artist.rating === 0
      ? `Awaiting ${Math.max(0, 3 - voteCount)} votes`
      : `${artist.rating.toFixed(1)} (${voteCount} votes)`;

  // Latest release is the most recent by year/month
  const latestRelease = releasesRaw.reduce<ReleaseRow | null>((best, r) => {
    if (!best) return r;
    if ((r.year ?? 0) > (best.year ?? 0)) return r;
    return best;
  }, null);

  const acronym = artist.acronym ?? artist.nick;

  return (
    <SiteLayout title="aRTIST iNFO">
      <LiveRefresh channel="site:votes" />
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">
            {artist.nick}
            <WatchingPip channel={`viewing:artist:${artist.id}`} />
          </h2>
        </div>
      </div>

      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Nick: </span>
        {artist.nick}
      </div>
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Crew(s): </span>
        {memberships.length > 0
          ? memberships.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                <Link href={`/crew/${urlsafe(m.crew ?? "")}`}>{m.crew}</Link>
              </span>
            ))
          : "-"}
      </div>
      {artist.www && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Webpage: </span>
          <a href={artist.www} target="_blank" rel="noopener noreferrer">
            {artist.www}
          </a>
        </div>
      )}
      {artist.country && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Country: </span>
          {artist.country}
        </div>
      )}
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Status: </span>
        {artist.active ?? "-"}
      </div>
      {artist.users && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Site profile: </span>
          <Link href={`/member/${artist.users.nickurl}`}>{artist.users.nick}</Link>
        </div>
      )}
      {artist.users?.joined && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Member since: </span>
          {formatJoined(artist.users.joined)}
        </div>
      )}
      {otherHandles.length > 0 && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Also known as: </span>
          {otherHandles.map((h, i) => (
            <span key={h.artisturl}>
              {i > 0 && ", "}
              <Link href={`/artist/${h.artisturl}`}>{h.nick}</Link>
            </span>
          ))}
        </div>
      )}
      {canClaim && (
        <div className="col-lg-12 pl-0 apt-1">
          <ClaimArtistButton artistNick={artist.nick ?? ""} />
        </div>
      )}
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Rating: </span>
        {ratingDisplay}
      </div>

      {/* Latest Release */}
      {latestRelease && (
        <>
          <div className="row apt-1">
            <h2 className="ap-1 bg-header">Latest Release</h2>
          </div>
          <div className="col-lg-12 pl-0 d-flex justify-content-between">
            <div className="col-lg-4 pl-0">
              <Link className="magenta" href={`/release/${latestRelease.filename}`}>
                {latestRelease.filename.slice(0, 20)}
              </Link>
            </div>
            <div className="col-lg-4 pl-0">
              {latestRelease.name?.slice(0, 35) ?? "-"}
            </div>
            {latestRelease.crew && latestRelease.crewurl && (
              <div className="col-lg-2 pl-0">
                <Link href={`/crew/${latestRelease.crewurl}`}>{latestRelease.crew}</Link>
              </div>
            )}
            <div className="col-lg-2 pl-0">
              <span className="lightgrey">{latestRelease.year}</span>
            </div>
          </div>
        </>
      )}

      {/* Sort links — each wrapped in col-lg-3 so the header alignment matches
          the data rows below (same 4 × col-lg-3 grid). Without the wrappers,
          justify-content-between distributes them by natural text width and
          they end up offset relative to the columns. */}
      <div className="row apt-1 apb-1">
        <h2 className="bg-header">All {acronym} Releases</h2>
      </div>
      <div className="col-lg-12 d-flex justify-content-between pl-0">
        <div className="col-lg-3 pl-0"><Link href={`?sort_by=c.filename`}>Filename</Link></div>
        <div className="col-lg-3 pl-0"><Link href={`?sort_by=c.name`}>Name</Link></div>
        <div className="col-lg-3 pl-0"><Link href={`?sort_by=w.name`}>Crew</Link></div>
        <div className="col-lg-3 pl-0"><Link href={`?sort_by=c.year`}>Release Date</Link></div>
      </div>

      {/* All releases */}
      {releasesRaw.map((r) => (
        <div
          key={r.colly_id}
          className="col-lg-12 d-flex justify-content-between pl-0"
        >
          <div className="col-lg-3 pl-0">
            <Link className="magenta" href={`/release/${r.filename}`}>
              {r.filename.slice(0, 12)}
            </Link>
          </div>
          <div className="col-lg-3 pl-0">
            <Link className="magenta" href={`/release/${r.filename}`}>
              {r.name?.slice(0, 35) ?? r.filename}
            </Link>
          </div>
          <div className="col-lg-3 pl-0">
            {r.crew && r.crewurl ? (
              <Link href={`/crew/${r.crewurl}`}>{r.crew}</Link>
            ) : (
              r.crew ?? "-"
            )}
          </div>
          <div className="col-lg-3 pl-0">
            <span className="lightgrey">{r.year ?? "-"}</span>
          </div>
        </div>
      ))}
    </SiteLayout>
  );
}
