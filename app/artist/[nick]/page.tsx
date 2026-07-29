import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ContentLink from "@/components/ui/ContentLink";
import { countrySlug } from "@/lib/countrySlug";
import { readFileSync, existsSync } from "fs";
import path from "path";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { getSession as auth } from "@/lib/session";
import { urlsafe, decodeParam, formatBytes } from "@/lib/utils";
import { encodeReleaseText } from "@/lib/releaseText";
import { normalizeOrder } from "@/lib/sort-headers";
import { activeStatusLabel } from "@/lib/activeStatus";
import { type ReleaseSortKey } from "@/lib/release-sort";
import { buildArtistReleasesQuery } from "@/lib/artistReleasesQuery";
import ArtistReleases from "./ArtistReleases";
import EntityLogosSection from "@/components/release/EntityLogosSection";
import SceneLinksSection from "@/components/release/SceneLinksSection";
import { logosForEntity } from "@/lib/collyLogoSearch";
import { artistsWith } from "@/lib/sceneGraph";

// Recognised sort keys for the "All Releases" table — shared (as clean keys)
// with the client component and the JS comparator in lib/release-sort.
const RELEASE_SORT_KEYS: ReleaseSortKey[] = ["filename", "name", "crew", "year"];
const DEFAULT_SORT_KEY: ReleaseSortKey = "filename";

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
    return encodeReleaseText(readFileSync(dizPath), "auto");
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ nick: string }>;
  searchParams: Promise<{ sort_by?: string; order?: string }>;
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
  // joined is legacy: sometimes a unix-timestamp string, sometimes "YYYY-MM-DD".
  const d = /^\d+$/.test(ts) ? new Date(Number(ts) * 1000) : new Date(ts);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "Unknown";
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
  const { sort_by: rawSortBy, order: rawOrder } = await searchParams;

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
  const isAdmin = session?.user?.rank === "Admin";

  // Resolve the requested sort for the initial server render. The ordering
  // rules themselves live in lib/release-sort (the ArtistReleases client
  // component applies the same comparator and re-sorts in the browser), so
  // here we only validate which column/direction to start on.
  const sortKey: ReleaseSortKey = RELEASE_SORT_KEYS.includes(rawSortBy as ReleaseSortKey)
    ? (rawSortBy as ReleaseSortKey)
    : DEFAULT_SORT_KEY;
  const sortOrder = normalizeOrder(rawOrder);

  const [memberships, artistCollys, releasesRaw, otherHandles] = await Promise.all([
    prisma.member_of.findMany({ where: { nick: artist.nick } }),
    prisma.artists_collys.findMany({ where: { artist_id: artist.id }, select: { colly_id: true } }),
    prisma.$queryRaw<ReleaseRow[]>(buildArtistReleasesQuery(artist.id)),
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

  // "Awaiting N votes" only while votes are still needed; once enough votes
  // exist, show the rating (never the nonsensical "Awaiting 0 votes").
  const neededVotes = Math.max(0, 3 - voteCount);
  const ratingDisplay = (artist.rating && artist.rating > 0)
    ? `${artist.rating.toFixed(1)} (${voteCount} votes)`
    : neededVotes > 0
      ? `Awaiting ${neededVotes} vote${neededVotes !== 1 ? "s" : ""}`
      : `${Number(artist.rating ?? 0).toFixed(1)} (${voteCount} votes)`;

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
                <ContentLink href={`/crew/${urlsafe(m.crew ?? "")}`}>{m.crew}</ContentLink>
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
          <ContentLink href={`/country/${countrySlug(artist.country)}`}>{artist.country}</ContentLink>
        </div>
      )}
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Status: </span>
        {activeStatusLabel(artist.active)}
      </div>
      {artist.users && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Site profile: </span>
          <ContentLink href={`/member/${artist.users.nickurl}`}>{artist.users.nick}</ContentLink>
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
              <ContentLink href={`/artist/${h.artisturl}`}>{h.nick}</ContentLink>
            </span>
          ))}
        </div>
      )}
      {canClaim && (
        <div className="col-lg-12 pl-0 apt-1">
          <ClaimArtistButton artistNick={artist.nick ?? ""} />
        </div>
      )}
      {isAdmin && (
        <div className="col-lg-12 pl-0 apt-1">
          <Link prefetch={false} className="btn-big" href={`/admin/artists?q=${encodeURIComponent(artist.nick ?? "")}`}>
            Edit Artist Profile
          </Link>
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
                      style={{ lineHeight: "1" }}
                      dangerouslySetInnerHTML={{ __html: dizContent }}
                    />
                  </span>
                </div>
                {/* Right: metadata */}
                <div className="col-lg-4 apb-1">
                  <div>
                    <span className="white">Artist: </span>
                    <ContentLink className="green" href={`/artist/${artist.artisturl}`}>{artist.nick}</ContentLink>
                  </div>
                  {latestRelease.crew && latestRelease.crewurl && (
                    <div>
                      <span className="white">Crew: </span>
                      <ContentLink href={`/crew/${latestRelease.crewurl}`}>{latestRelease.crew}</ContentLink>
                    </div>
                  )}
                  <div><span className="white">Name: </span>{latestRelease.name ?? "-"}</div>
                  <div>
                    <span className="white">Filename: </span>
                    <ContentLink className="magenta" href={`/release/${latestRelease.filename}`}>{latestRelease.filename}</ContentLink>
                  </div>
                  <div><span className="white">Size: </span>{latestRelease.filesize != null ? formatBytes(Number(latestRelease.filesize)) : "-"}</div>
                  {lrShowDate && (
                    <div><span className="white">Released: </span>{[lrDay, lrMonth, lrYear].filter(Boolean).join(" ")}</div>
                  )}
                  <div><span className="white">Rating: </span>{lrRating}</div>
                  {latestRelease.uploader && (
                    <div>
                      <span className="white">Added by: </span>
                      <ContentLink href={`/member/${urlsafe(latestRelease.uploader)}`}>{latestRelease.uploader}</ContentLink>
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

      {/* All Releases table — sorts client-side, instantly, with no reload.
          The header bar, clickable sort headers, and rows all live in
          ArtistReleases so the whole list re-orders in the browser. */}
      <ArtistReleases
        rows={releasesRaw}
        acronym={acronym}
        initialSort={sortKey}
        initialOrder={sortOrder}
      />
      <EntityLogosSection hits={await logosForEntity("artist", artist.id)} title={`Collys with a ${artist.nick} logo`} />
      <SceneLinksSection links={await artistsWith(artist.id)} title={`${artist.nick} appears with`} color="green" />
    </SiteLayout>
  );
}
