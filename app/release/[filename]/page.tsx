import { readFileSync, existsSync } from "fs";
import path from "path";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { encodeReleaseText, releaseTextEncoding, releaseViewerType, stripFileIdDiz, convertAnsiCodes, hasAnsiCodes, looksLikeCp437Art } from "@/lib/releaseText";
import { readCollyText } from "@/lib/collyText";
import { parseCollyBytes, type CollyMeta } from "@/lib/collyTrailer";
import { convertPcbColors, hasPcbCodes } from "@/lib/pcbColors";
import { extractFirstRenderable } from "@/lib/archive";
import Cp437DizPreview from "@/components/release/Cp437DizPreview";
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

  // PC/CP437 block art is often stored under a generic "ASCII" type. Detect it
  // by content so it both decodes as CP437 and renders on the gap-free AnsiLove
  // canvas viewer (the Amiga text <pre> leaves gaps between rows of block art).
  let isCp437 = textEncoding === "cp437";
  if (!isCp437 && type === "ASCII" && existsSync(filePath)) {
    try { isCp437 = looksLikeCp437Art(readFileSync(filePath)); } catch { /* keep false */ }
  }

  // ASCII file content — read first so we can extract embedded file_id.diz
  let fileContent = "";
  let embeddedDiz: string | null = null;
  let hasPcb = false;
  // Invisible per-colly metadata after the Ctrl-Z EOF (SAUCE / key:value).
  let collyMeta: CollyMeta = {};
  if (type === "ASCII" && existsSync(filePath)) {
    try {
      const { visible, meta } = parseCollyBytes(readFileSync(filePath));
      collyMeta = meta;
      fileContent = encodeReleaseText(visible, textEncoding);
    } catch { fileContent = ""; }
    if (fileContent) {
      // Strip @BEGIN_FILE_ID.DIZ ... @END_FILE_ID.DIZ block (PHP cmds.php behaviour)
      const stripped = stripFileIdDiz(fileContent);
      fileContent = stripped.content;
      embeddedDiz = stripped.dizText;
    }
    // Convert ANSI escape codes to HTML spans — handles "broken" collys
    // that have ANSI codes but no resets, since each code auto-closes the
    // previous span (no color leaking).
    if (hasAnsiCodes(fileContent)) {
      fileContent = convertAnsiCodes(fileContent);
    }
    if (hasPcbCodes(fileContent)) {
      fileContent = convertPcbColors(fileContent);
      hasPcb = true;
    }
  }

  // Pure ANSI collys render on the canvas (from the file URL), so fileContent
  // stays empty — but autoplay / jump-index / logo detection need the decoded
  // plaintext to find logo rows. Provide it (ANSI-escapes stripped); line
  // numbers line up with the canvas, which AnsiLove renders one row per line.
  let logoText = "";
  if (type === "ANSI" && existsSync(filePath)) {
    logoText = readCollyText(filename, type) ?? "";
    // The ASCII branch pulls the embedded @BEGIN_FILE_ID.DIZ block; ANSI never
    // did, so its .diz was lost. Extract it here too (decode + strip markers),
    // and capture the invisible trailer metadata.
    try {
      const { visible, meta } = parseCollyBytes(readFileSync(filePath));
      collyMeta = meta;
      const stripped = stripFileIdDiz(encodeReleaseText(visible, textEncoding));
      if (stripped.dizText) embeddedDiz = stripped.dizText;
    } catch { /* no embedded diz */ }
  }

  // For archives, try to extract a renderable ASCII file so it can be
  // displayed prominently as a "hero" above the archive file browser. The
  // client renders it through AnsiLove — the same pixel-perfect path as the
  // other entries — rather than decoding it to text (which mangles ANSI/CP437
  // art). We only need its entry name here; the client fetches the bytes.
  let extractedEntry: string | null = null;
  if (type === "ARCHIVE") {
    const extracted = extractFirstRenderable(filename);
    if (extracted) extractedEntry = extracted.entry;
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

  // PC/CP437 block-art dizzes render gappy in the Amiga webfont, so render them
  // through AnsiLove instead (same as the colly). Only file-based dizzes carry
  // raw bytes; embedded dizzes are already decoded text and fall back to <pre>.
  let dizCp437B64: string | null = null;
  {
    let dizBytes: Buffer | null = null;
    if (existsSync(dizPath)) { try { dizBytes = readFileSync(dizPath); } catch { dizBytes = null; } }
    else if (!embeddedDiz && existsSync(fallbackDizPath)) { try { dizBytes = readFileSync(fallbackDizPath); } catch { dizBytes = null; } }
    if (dizBytes && looksLikeCp437Art(new Uint8Array(dizBytes))) {
      dizCp437B64 = dizBytes.toString("base64");
    }
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
  // The colly's own settings — the submit-form DB columns, else the invisible
  // trailer — are the artist's intended look, so they win over the viewer's
  // global pref for the INITIAL render. The viewer's live picker still overrides.
  const collyFont = colly.render_font || collyMeta.font;
  const collyFg = colly.render_fg || collyMeta.fg;
  const collyBg = colly.render_bg || collyMeta.bg;
  if (collyFont) font = collyFont;
  if (collyFg) fgcolor = collyFg;
  if (collyBg) bgcolor = collyBg;
  const soundtrack = colly.soundtrack || collyMeta.soundtrack || null;
  // PCB-coloured collys use exact background colours per span; the
  // wrapper <pre> must be black so the gaps look correct.
  if (hasPcb) bgcolor = "#000000";

  const isArchive = type === "ARCHIVE";
  const collyId = Number(colly.id);
  const collyFileUrl = `/collections/${dirname}/${filename}`;

  // Artist-mapped logos (manual=1) drive rendering/autoplay/jumps; without a
  // manual map the viewer falls back to live detection. Stored in the DB now,
  // not in the file.
  let dbLogoMap: { line: number; end?: number; caption: string }[] | null = null;
  try {
    const ml = await prisma.colly_logos.findMany({
      where: { colly_id: collyId, manual: 1 },
      orderBy: { position: "asc" },
      select: { start_line: true, end_line: true, label: true },
    });
    if (ml.length) dbLogoMap = ml.map((r) => ({ line: r.start_line + 1, end: r.end_line != null ? r.end_line + 1 : undefined, caption: r.label }));
  } catch { /* catalog may be unavailable */ }

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
              {dizCp437B64 ? (
                <Cp437DizPreview bytesB64={dizCp437B64} />
              ) : (
                <pre className="magenta apt-1" style={{ lineHeight: "1" }} dangerouslySetInnerHTML={{ __html: dizContent }} />
              )}
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
                    <Link className="green" href={`/artist/${a?.artisturl ?? ""}`}>{a?.nick}</Link>
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
        logoText={logoText}
        soundtrack={soundtrack}
        logoMap={dbLogoMap}
        extractedEntry={extractedEntry}
        type={type}
        isCp437={isCp437}
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
