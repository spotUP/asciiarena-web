import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync, existsSync } from "fs";
import path from "path";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSession as auth } from "@/lib/session";
import { urlsafe, decodeParam, formatBytes } from "@/lib/utils";

const MONTHS = [
  "Unknown", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
import ClaimArtistButton from "./ClaimArtistButton";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import WatchingPip from "@/components/widgets/WatchingPip";

// Reads the .diz preview for a colly filename and HTML-escapes it for
// dangerouslySetInnerHTML. Matches the home LatestReleasesStatic widget
// so the Latest Release card on the artist page looks identical.
function readReleaseDiz(filename: string): string | null {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  const dizPath = path.join(collectionsPath, dirname, `${filename}.diz`);
  try {
    if (!existsSync(dizPath)) return null;
    return readFileSync(dizPath).toString("latin1")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  } catch {
    return null;
  }
}

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
  month: number | null;
  day: number | null;
  filesize: number | null;
  uploader: string | null;
  view_counter: number | null;
  downloads: number | null;
  rating: number | null;
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
  // REGEXP_REPLACE strips ALL leading non-alphanumeric chars before sort —
  // covers leading spaces, tabs, control chars, BOM, punctuation, etc.
  // Plain TRIM only strips spaces (ASCII 0x20), so a row with a leading
  // tab/CR/LF (ASCII < 0x20) still bubbled to the top. CASE picks
  // filename when c.name is missing/blank, matching the UI fallback.
  const SORT_SQL: Record<string, Prisma.Sql> = {
    "c.filename":       Prisma.sql`LOWER(REGEXP_REPLACE(c.filename, '^[^[:alnum:]]+', ''))`,
    "c.name":           Prisma.sql`LOWER(REGEXP_REPLACE(CASE WHEN c.name IS NULL OR LENGTH(TRIM(c.name)) = 0 THEN c.filename ELSE c.name END, '^[^[:alnum:]]+', ''))`,
    "w.name":           Prisma.sql`(w.name IS NULL OR LENGTH(TRIM(w.name)) = 0), LOWER(REGEXP_REPLACE(COALESCE(w.name, ''), '^[^[:alnum:]]+', ''))`,
    "c.year":           Prisma.sql`c.year`,
    "c.year, c.month":  Prisma.sql`c.year, c.month`,
  };
  const sortSql = (rawSortBy && SORT_SQL[rawSortBy]) ?? Prisma.sql`c.filename`;

  const [memberships, artistCollys, releasesRaw, otherHandles] = await Promise.all([
    prisma.member_of.findMany({ where: { nick: artist.nick } }),
    prisma.artists_collys.findMany({ where: { artist_id: artist.id }, select: { colly_id: true } }),
    prisma.$queryRaw<ReleaseRow[]>`
      SELECT ac.colly_id, c.filename, c.name, c.year, c.month, c.day,
             c.filesize, c.uploader, c.view_counter, c.downloads, c.rating,
             w.name AS crew, w.crewurl
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

  // Latest release is the most recent by year/month — shown in its own
  // card above the All Releases table.
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

      {/* Latest Release — same .diz-left/metadata-right layout as
          /release/[filename] info_release_summary, so the artist page
          mirrors the dedicated release page. Falls back silently when
          the .diz file is missing. */}
      {latestRelease && (() => {
        const dizContent = readReleaseDiz(latestRelease.filename);
        if (!dizContent) return null;
        const lrDay = latestRelease.day && latestRelease.day !== 0 ? latestRelease.day : null;
        const lrMonth = latestRelease.month && latestRelease.month !== 0 ? MONTHS[latestRelease.month] : null;
        const lrYear = latestRelease.year && latestRelease.year !== 0 ? latestRelease.year : null;
        const lrShowDate = lrDay || lrMonth || lrYear;
        const lrRating = (latestRelease.rating && latestRelease.rating > 0)
          ? `${Number(latestRelease.rating).toFixed(1)}`
          : "Awaiting votes";
        return (
          <>
            <div className="row apt-1">
              <h2 className="ap-1 bg-header">Latest Release</h2>
            </div>
            <div className="container-fluid">
              <div className="row apt-1 apl-1 apr-1 bg-secondary overflow-hidden">
                {/* Left: .diz preview */}
                <div className="col-lg-8 d-flex justify-content-center justify-content-lg-start" style={{ position: "relative", top: "-16px" }}>
                  <span>
                    <pre
                      className="magenta apt-1"
                      dangerouslySetInnerHTML={{ __html: dizContent }}
                    />
                  </span>
                </div>
                {/* Right: metadata */}
                <div className="col-lg-4 apb-1">
                  <div>
                    <span className="white">Artist: </span>
                    <Link className="green" href={`/artist/${artist.artisturl}`}>{artist.nick}</Link>
                  </div>
                  {latestRelease.crew && latestRelease.crewurl && (
                    <div>
                      <span className="white">Crew: </span>
                      <Link href={`/crew/${latestRelease.crewurl}`}>{latestRelease.crew}</Link>
                    </div>
                  )}
                  <div><span className="white">Name: </span>{latestRelease.name ?? "-"}</div>
                  <div>
                    <span className="white">Filename: </span>
                    <Link className="magenta" href={`/release/${latestRelease.filename}`}>{latestRelease.filename}</Link>
                  </div>
                  <div><span className="white">Size: </span>{latestRelease.filesize != null ? formatBytes(Number(latestRelease.filesize)) : "-"}</div>
                  {lrShowDate && (
                    <div><span className="white">Released: </span>{[lrDay, lrMonth, lrYear].filter(Boolean).join(" ")}</div>
                  )}
                  <div><span className="white">Rating: </span>{lrRating}</div>
                  {latestRelease.uploader && (
                    <div>
                      <span className="white">Added by: </span>
                      <Link href={`/member/${urlsafe(latestRelease.uploader)}`}>{latestRelease.uploader}</Link>
                    </div>
                  )}
                  <div><span className="white">Viewed: </span>{latestRelease.view_counter ?? 0} times</div>
                  <div><span className="white">Downloaded: </span>{latestRelease.downloads ?? 0} time{(latestRelease.downloads ?? 0) !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Sort links — each wrapped in col-lg-3 so the header alignment matches
          the data rows below (same 4 × col-lg-3 grid). Without the wrappers,
          justify-content-between distributes them by natural text width and
          they end up offset relative to the columns. */}
      <div className="row apt-1 apb-1">
        <h2 className="ap-1 bg-header">All {acronym} Releases</h2>
      </div>
      {/* Plain <a> tags (not Next.js <Link>) so each sort click is a full
          page navigation. Link would use the Router Cache and could serve
          a previously-loaded sort order when only searchParams change —
          that was the symptom dipswitch caught on FF: click Crew then
          Name, the page stayed on the Crew sort and just looked broken. */}
      <div className="col-lg-12 d-flex justify-content-between pl-0">
        <div className="col-lg-3 pl-0"><a href={`?sort_by=c.filename`}>Filename</a></div>
        <div className="col-lg-3 pl-0"><a href={`?sort_by=c.name`}>Name</a></div>
        <div className="col-lg-3 pl-0"><a href={`?sort_by=w.name`}>Crew</a></div>
        <div className="col-lg-3 pl-0"><a href={`?sort_by=c.year`}>Release Date</a></div>
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
