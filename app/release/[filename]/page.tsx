import { readFileSync, existsSync } from "fs";
import path from "path";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { encodeReleaseText, releaseTextEncoding, releaseViewerType, stripFileIdDiz } from "@/lib/releaseText";
import { convertPcbColors, hasPcbCodes } from "@/lib/pcbColors";
import { getSession as auth } from "@/lib/session";
import { urlsafe, formatBytes, decodeParam } from "@/lib/utils";
import ReleaseClient from "./ReleaseClient";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import WatchingPip from "@/components/widgets/WatchingPip";

interface PageProps {
  params: Promise<{ filename: string }>;
}

function encodeFileText(filePath: string, encoding = releaseTextEncoding(null, null)): string {
  return encodeReleaseText(readFileSync(filePath), encoding);
}

const MONTHS = [
  "Unknown", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { filename: rawFilename } = await params;
  const filename = decodeParam(rawFilename).replace(/\.\./g, "").replace(/[/\\]/g, "");

  const colly = await prisma.collys.findFirst({ where: { filename } });
  if (!colly) return {};

  const artistRows = await prisma.artists_collys.findMany({
    where: { colly_id: colly.id },
    include: { artists: true },
    orderBy: { sortorder: "asc" },
  });
  const artistNames = artistRows.map(r => r.artists?.nick).filter(Boolean).join(", ") || "unknown";
  const year = colly.year ? ` (${colly.year})` : "";
  const title = `${colly.name ?? filename} by ${artistNames}${year} | aSCIIaRENA`;

  return {
    title,
    description: `ASCII art release: ${colly.name ?? filename} by ${artistNames}`,
    openGraph: { title, url: `/release/${filename}` },
  };
}

export default async function ReleasePage({ params }: PageProps) {
  const { filename: rawFilename } = await params;
  const filename = decodeParam(rawFilename).replace(/\.\./g, "").replace(/[/\\]/g, "");

  const [colly, session] = await Promise.all([
    prisma.collys.findFirst({ where: { filename } }),
    auth(),
  ]);
  if (!colly) notFound();

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const userNick = session?.user?.name ?? "";
  const isAdmin = session?.user?.rank === "Admin";

  // Batch 2: everything that only needs colly.id / userId
  const [artistRows, crewRows, ratingAgg, isFavouritedCount, favouritesTotal, userPrefs] = await Promise.all([
    prisma.artists_collys.findMany({
      where: { colly_id: colly.id },
      include: { artists: true },
      orderBy: { sortorder: "asc" },
    }),
    prisma.collys_crews.findMany({
      where: { colly_id: colly.id },
      include: { crews: true },
      orderBy: { sortorder: "asc" },
    }),
    prisma.comments.aggregate({ where: { colly_id: colly.id, rating: { gt: 0 } }, _count: { rating: true }, _avg: { rating: true } }),
    userId
      ? prisma.favourites.count({ where: { user_id: userId, colly_id: colly.id } })
      : Promise.resolve(0),
    prisma.favourites.count({ where: { colly_id: colly.id } }),
    userId
      ? prisma.users.findFirst({
          where: { id: userId },
          select: { def_font: true, def_fg_col: true, def_bg_col: true },
        })
      : Promise.resolve(null),
  ]);

  const artists = artistRows.map(r => r.artists).filter(Boolean);
  const crews = crewRows.map(r => r.crews).filter(Boolean);
  const isFavourited = isFavouritedCount > 0;

  // Batch 3: "more from" — depend on artists[0] / crews[0]
  const [moreByArtist, moreFromCrew] = await Promise.all([
    artists[0] ? prisma.artists_collys.findMany({
      where: { artist_id: artists[0].id, NOT: { colly_id: colly.id } },
      include: { collys: { select: { filename: true, name: true } } },
      take: 6,
      orderBy: { colly_id: "desc" },
    }) : Promise.resolve([]),
    crews[0] ? prisma.collys_crews.findMany({
      where: { crew_id: crews[0].id, NOT: { colly_id: colly.id } },
      include: { collys: { select: { filename: true, name: true } } },
      take: 6,
      orderBy: { colly_id: "desc" },
    }) : Promise.resolve([]),
  ]);

  // Show "Awaiting N votes" only while votes are still needed. Once enough
  // votes exist, show the live average computed from the votes themselves
  // (colly.rating is a stored aggregate that can lag, which is what produced
  // the nonsensical "Awaiting 0 votes" — enough votes, but no shown rating).
  const voteCount = ratingAgg._count.rating ?? 0;
  const avgRating = ratingAgg._avg.rating != null ? Number(ratingAgg._avg.rating) : null;
  const neededVotes = Math.max(0, 3 - voteCount);
  const ratingDisplay = neededVotes > 0
    ? `Awaiting ${neededVotes} vote${neededVotes !== 1 ? "s" : ""}`
    : `${(avgRating ?? Number(colly.rating ?? 0)).toFixed(1)} (${voteCount} vote${voteCount !== 1 ? "s" : ""})`;

  // File paths
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  const filePath = path.join(collectionsPath, dirname, filename);
  const dizPath = `${filePath}.diz`;
  const fallbackDizPath = path.join(collectionsPath, "file_id.diz.txt");
  const storedType = (colly.type ?? "ASCII").toUpperCase();
  const textEncoding = releaseTextEncoding(storedType, colly.broken_comment);
  const type = releaseViewerType(storedType);

  // ASCII file content — read first so we can extract embedded file_id.diz
  let fileContent = "";
  let embeddedDiz: string | null = null;
  let hasPcb = false;
  if (type === "ASCII" && existsSync(filePath)) {
    try { fileContent = encodeFileText(filePath, textEncoding); } catch { fileContent = ""; }
    if (fileContent) {
      // Strip @BEGIN_FILE_ID.DIZ ... @END_FILE_ID.DIZ block (PHP cmds.php behaviour)
      const stripped = stripFileIdDiz(fileContent);
      fileContent = stripped.content;
      embeddedDiz = stripped.dizText;
    }
    if (hasPcbCodes(fileContent)) {
      fileContent = convertPcbColors(fileContent);
      hasPcb = true;
    }
  }

  // .diz file preview for summary card — prefer separate .diz, fall back to
  // embedded markers, then the global fallback.
  let dizContent = "";
  if (existsSync(dizPath)) {
    try { dizContent = encodeFileText(dizPath, textEncoding); } catch { dizContent = ""; }
  } else if (embeddedDiz) {
    dizContent = embeddedDiz;
  } else if (existsSync(fallbackDizPath)) {
    try { dizContent = encodeFileText(fallbackDizPath, textEncoding); } catch { dizContent = ""; }
  }
  if (hasPcbCodes(dizContent)) {
    dizContent = convertPcbColors(dizContent);
  }

  // User viewer preferences (fetched in batch 2 as userPrefs)
  let font = "mOsOul";
  let fgcolor = "#FF55FF";
  let bgcolor = "#111111";
  if (userPrefs) {
    if (userPrefs.def_font && userPrefs.def_font.length > 1) font = userPrefs.def_font;
    if (userPrefs.def_fg_col && userPrefs.def_fg_col.length > 1) fgcolor = userPrefs.def_fg_col;
    if (userPrefs.def_bg_col && userPrefs.def_bg_col.length > 1) bgcolor = userPrefs.def_bg_col;
  }
  // PCB-coloured collys use exact background colours per span; the
  // wrapper <pre> must be black so the gaps look correct.
  if (hasPcb) bgcolor = "#000000";

  const isArchive = type === "ARCHIVE";
  const collyId = Number(colly.id);
  const collyFileUrl = `/collections/${dirname}/${filename}`;

  // Date display
  const day = colly.day && colly.day !== 0 ? colly.day : null;
  const month = colly.month && colly.month !== 0 ? MONTHS[colly.month] : null;
  const year = colly.year && colly.year !== 0 ? colly.year : null;
  const showDate = day || month || year;

  const downloads = Number(colly.downloads ?? 0);

  return (
    <SiteLayout title="rELEAsE iNFO">
      <LiveRefresh channel="site:votes" />
      {/* Summary card — matches info_release_summary.php */}
      <div className="row">
        <div className="header col-lg-12">
          <h1 className="ap-1 bg-header">
            {colly.name ?? colly.filename}
            <WatchingPip channel={`viewing:release:${colly.id}`} />
          </h1>
        </div>
      </div>
      <div className="container-fluid">
        <div className="row apt-1 apl-1 apr-1 bg-secondary overflow-hidden">

          {/* Left: .diz file preview */}
          <div className="animate__animated animate__backInLeft col-lg-8 d-flex justify-content-center justify-content-lg-start" style={{ position: "relative", top: "-16px" }}>
            <span>
              <pre className="magenta apt-1" dangerouslySetInnerHTML={{ __html: dizContent }} />
            </span>
          </div>

          {/* Right: metadata */}
          <div className="col-lg-4 apb-1">
            <div>
              <span className="white">Artist(s): </span>
              {artists.length > 0
                ? artists.map((a, i) => (
                  <span key={a?.id ?? i}>
                    {i > 0 && " & "}
                    <Link className="green" href={`/artist/${urlsafe(a?.nick ?? "")}`}>{a?.nick}</Link>
                  </span>
                ))
                : "-"}
            </div>
            {crews.length > 0 && (
              <div>
                <span className="white">Crew(s): </span>
                {crews.map((c, i) => (
                  <span key={c?.id ?? i}>
                    {i > 0 && " & "}
                    <Link href={`/crew/${urlsafe(c?.name ?? "")}`}>{c?.name}</Link>
                  </span>
                ))}
              </div>
            )}
            <div><span className="white">Filename: </span>{colly.filename}</div>
            <div><span className="white">Size: </span>{colly.filesize != null ? formatBytes(Number(colly.filesize)) : "-"}</div>
            {showDate && (
              <div><span className="white">Released: </span>{[day, month, year].filter(Boolean).join(" ")}</div>
            )}
            <div><span className="white">Rating: </span>{ratingDisplay}</div>
            <div><span className="white">Added by: </span><Link href={`/member/${urlsafe(colly.uploader ?? "")}`}>{colly.uploader}</Link></div>
            <div><span className="white">Viewed: </span>{colly.view_counter ?? 0} times</div>
            <div><span className="white">Downloaded: </span>{downloads} Time{downloads !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {moreByArtist.length > 0 && (
        <div className="container-fluid">
          <div className="row apt-1">
            <div className="col-12">
              {/* marginBottom 0 overrides the site-wide bg-header
                  gap; this header sits flush against the bg-secondary
                  strip directly below it. */}
              <h2 className="ap-1 bg-header" style={{ marginBottom: 0 }}>More by {artists[0]?.nick}</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-12 bg-secondary apt-1 apb-1">
              <div className="row">
                {moreByArtist.map(r => (
                  <div key={r.colly_id} className="col-12 col-sm-6 col-md-4 text-truncate apl-1 apb-1">
                    <Link className="magenta" href={`/release/${r.collys?.filename}`}>
                      {r.collys?.name ?? r.collys?.filename}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {moreFromCrew.length > 0 && (
        <div className="container-fluid">
          <div className="row apt-1">
            <div className="col-12">
              <h2 className="ap-1 bg-header" style={{ marginBottom: 0 }}>More from {crews[0]?.name}</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-12 bg-secondary apt-1 apb-1">
              <div className="row">
                {moreFromCrew.map(r => (
                  <div key={r.colly_id} className="col-12 col-sm-6 col-md-4 text-truncate apl-1 apb-1">
                    <Link className="magenta" href={`/release/${r.collys?.filename}`}>
                      {r.collys?.name ?? r.collys?.filename}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Suspense>
      <ReleaseClient
        collyId={collyId}
        filename={filename}
        collyFileUrl={collyFileUrl}
        userNick={userNick}
        isAdmin={isAdmin}
        isFavourited={isFavourited}
        initBgColor={bgcolor}
        initFgColor={fgcolor}
        initFont={font}
        isArchive={isArchive}
        fileContent={fileContent}
        type={type}
        collyTitle={colly.name ?? filename}
        siteUrl={process.env.NEXTAUTH_URL ?? "https://asciiarena.se"}
        initialViewCount={Number(colly.view_counter ?? 0)}
        initialFavCount={favouritesTotal}
        initialDownloadCount={downloads}
      />

      </Suspense>

    </SiteLayout>
  );
}
