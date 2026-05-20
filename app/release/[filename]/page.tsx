import { readFileSync, existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Script from "next/script";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { urlsafe, formatBytes } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface PageProps {
  params: Promise<{ filename: string }>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface FavouriteRow {
  id: number;
}

export default async function ReleasePage({ params }: PageProps) {
  const { filename: rawFilename } = await params;

  // Sanitize: strip path traversal sequences
  const filename = rawFilename.replace(/\.\./g, "").replace(/[/\\]/g, "");

  const colly = await prisma.collys.findFirst({ where: { filename } });
  if (!colly) notFound();

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  // Check if favourited
  let isFavourited = false;
  if (userId) {
    const favRows = await prisma.$queryRaw<FavouriteRow[]>(
      Prisma.sql`SELECT id FROM favourites WHERE user_id = ${userId} AND colly_id = ${colly.id} LIMIT 1`
    );
    isFavourited = favRows.length > 0;
  }

  // Fetch artists via join
  const artistRows = await prisma.artists_collys.findMany({
    where: { colly_id: colly.id },
    include: { artists: true },
    orderBy: { sortorder: "asc" },
  });
  const artists = artistRows.map((r) => r.artists);

  // Fetch crews via join
  const crewRows = await prisma.collys_crews.findMany({
    where: { colly_id: colly.id },
    include: { crews: true },
    orderBy: { sortorder: "asc" },
  });
  const crews = crewRows.map((r) => r.crews);

  // Vote count from comments
  const voteCount = await prisma.comments.count({
    where: { colly_id: colly.id, rating: { gt: 0 } },
  });

  const ratingDisplay =
    !colly.rating || colly.rating === 0
      ? `Awaiting ${Math.max(0, 3 - voteCount)} votes`
      : `${colly.rating.toFixed(1)} (${voteCount} votes)`;

  // Build file path
  const collectionsPath =
    process.env.COLLECTIONS_PATH ??
    path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  const filePath = path.join(collectionsPath, dirname, filename);

  const type = (colly.type ?? "ASCII").toUpperCase();

  let fileContent = "";
  if (type === "ASCII") {
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, "utf-8");
        fileContent = escapeHtml(raw);
      } catch {
        fileContent = "";
      }
    }
  }

  // Viewer defaults
  const bgcolor = "#000000";
  const fgcolor = "#aaaaaa";
  const font = "Courier New, monospace";

  const collyFileUrl = `/collections/${dirname}/${filename}`;

  // Date display
  const dateDisplay = [
    colly.year,
    colly.month != null ? String(colly.month).padStart(2, "0") : null,
    colly.day != null ? String(colly.day).padStart(2, "0") : null,
  ]
    .filter(Boolean)
    .join("-");

  const isArchiveType = type === "ARCHIVE";

  return (
    <SiteLayout title="rELEAsE iNFO">
      {/* Metadata summary card */}
      <div className="info_release_summary row ms-0 me-0 apb-1">
        <div className="col-lg-12 ps-0">
          <div className="row ms-0 me-0">
            <div className="col-lg-12 ps-0">
              <div className="row ms-0 me-0 apt-1 apb-1">
                <div className="header col-lg-12 ps-0">
                  <h2 className="ap-1 bg-header">
                    {colly.name ?? colly.filename}
                  </h2>
                </div>
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Name: </span>
                {colly.name ?? "-"}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Artist(s): </span>
                {artists.length > 0
                  ? artists.map((a, i) => (
                      <span key={a?.id ?? i}>
                        {i > 0 && " & "}
                        {a ? (
                          <a
                            className="magenta"
                            href={`/artist/${urlsafe(a.nick)}`}
                          >
                            {a.nick}
                          </a>
                        ) : (
                          "-"
                        )}
                      </span>
                    ))
                  : "-"}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Crew(s): </span>
                {crews.length > 0
                  ? crews.map((c, i) => (
                      <span key={c?.id ?? i}>
                        {i > 0 && " & "}
                        {c ? (
                          <a href={`/crew/${urlsafe(c.name)}`}>{c.name}</a>
                        ) : (
                          "-"
                        )}
                      </span>
                    ))
                  : "-"}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Filename: </span>
                {colly.filename}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Filesize: </span>
                {colly.filesize != null ? formatBytes(colly.filesize) : "-"}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Date: </span>
                {dateDisplay || "-"}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Type: </span>
                {colly.type ?? "-"}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Rating: </span>
                {ratingDisplay}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Views: </span>
                {colly.view_counter ?? 0}
              </div>
              <div className="col-lg-12 ps-0">
                <span className="lightgrey">Downloads: </span>
                {colly.downloads ?? 0}
              </div>
              {colly.uploader && (
                <div className="col-lg-12 ps-0">
                  <span className="lightgrey">Uploaded by: </span>
                  {colly.uploader}
                </div>
              )}
              {colly.broken != null && colly.broken > 0 && (
                <div className="col-lg-12 ps-0">
                  <span className="lightgrey">Broken: </span>
                  {colly.broken_comment ?? "Reported broken"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Colly viewer */}
      <div
        id="blacker"
        style={{ backgroundColor: bgcolor }}
      />
      <div
        className="container-fluid bg-secondary amb-1 p-0"
        style={{ marginTop: "36px" }}
      >
        <div className="row ms-0 me-0 p-1">
          {/* Action buttons */}
          <div className="col d-flex flex-wrap gap-1 align-items-center">
            {!isArchiveType && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                id="hide-colly-btn"
                onClick={undefined}
              >
                Hide Colly
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              id="fullscreen-btn"
            >
              Fullscreen
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={undefined}
              id="download-btn"
            >
              Download
            </button>

            {/* Share dropdown */}
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Share
              </button>
              <ul className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://asciiarena.se/release/${filename}`)}&text=${encodeURIComponent(colly.name ?? filename)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter / X
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://asciiarena.se/release/${filename}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                </li>
              </ul>
            </div>

            {/* Authenticated actions */}
            {userId && (
              <>
                <a
                  className="btn btn-sm btn-outline-secondary"
                  href={`#add-comment`}
                >
                  Add Comment
                </a>
                <button
                  type="button"
                  className={`btn btn-sm ${isFavourited ? "btn-secondary" : "btn-outline-secondary"}`}
                  id="favourite-btn"
                  data-colly-id={colly.id}
                  data-favourited={isFavourited ? "1" : "0"}
                >
                  {isFavourited ? "Unfavourite" : "Favourite"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  id="report-broken-btn"
                  data-colly-id={colly.id}
                >
                  Report Broken
                </button>
              </>
            )}
          </div>

          {/* Colour and font selectors */}
          <div className="col-auto d-flex align-items-center gap-2 pe-2">
            <span className="text-secondary small">BG:</span>
            <div id="colorselector_1" />
            <span className="text-secondary small">FG:</span>
            <div id="colorselector_2" />
            <select id="colly-font" className="form-select form-select-sm" style={{ width: "auto" }}>
              <option value="Courier New, monospace">Courier New</option>
              <option value="monospace">Monospace</option>
              <option value="'Topaz', monospace">Topaz</option>
              <option value="'Perfect DOS VGA 437', monospace">DOS VGA</option>
            </select>
          </div>
        </div>
      </div>

      {/* ASCII viewer */}
      {type === "ASCII" && (
        <div
          className="row ms-0 me-0 amb-1 p-0 justify-content-center align-items-center"
          style={{ overflowY: "scroll", height: "100vh", backgroundColor: bgcolor }}
          id="colly-div"
        >
          <pre
            id="colly"
            style={{
              overflow: "hidden",
              fontFamily: font,
              color: fgcolor,
              whiteSpace: "pre",
            }}
            dangerouslySetInnerHTML={{ __html: fileContent }}
          />
        </div>
      )}

      {/* ANSI viewer */}
      {type === "ANSI" && (
        <div
          className="row ms-0 me-0 amb-1 p-0 justify-content-center"
          style={{ backgroundColor: "#000" }}
          id="colly-div"
        >
          <span
            id="loading"
            style={{ animation: "blink 2s linear infinite" }}
          >
            .LOADiNG.
          </span>
          <div id="colly" style={{ paddingTop: "64px" }} />
          {/* TODO: wire up ansilove.js renderer */}
        </div>
      )}

      {/* Colour selector init */}
      <Script id="colorselector-init" strategy="afterInteractive">{`
        $(function() {
          if (typeof $.fn.colorselector === 'function') {
            $('#colorselector_1').colorselector({
              callback: function(value, color) {
                $('#colly').css('background-color', color);
                $('#colly-div').css('background-color', color);
                $('#blacker').css('background-color', color);
              }
            });
            $('#colorselector_2').colorselector({
              callback: function(value, color) {
                $('#colly').css('color', color);
              }
            });
          }
          $('#colly-font').on('change', function() {
            $('#colly').css('font-family', $(this).val());
          });
          $('#hide-colly-btn').on('click', function() {
            $('#colly-div').toggle();
          });
          $('#fullscreen-btn').on('click', function() {
            var el = document.getElementById('colly-div');
            if (el && el.requestFullscreen) el.requestFullscreen();
          });
          $('#download-btn').on('click', function() {
            downloadfile();
          });
          $('#favourite-btn').on('click', function() {
            var btn = $(this);
            var collyId = btn.data('colly-id');
            var favourited = btn.data('favourited') === '1';
            if (favourited) {
              fetch('/api/collys/' + collyId + '/favourites', { method: 'DELETE' })
                .then(function() {
                  btn.data('favourited', '0');
                  btn.removeClass('btn-secondary').addClass('btn-outline-secondary');
                  btn.text('Favourite');
                });
            } else {
              fetch('/api/collys/' + collyId + '/favourites', { method: 'POST' })
                .then(function() {
                  btn.data('favourited', '1');
                  btn.removeClass('btn-outline-secondary').addClass('btn-secondary');
                  btn.text('Unfavourite');
                });
            }
          });
          $('#report-broken-btn').on('click', function() {
            var collyId = $(this).data('colly-id');
            fetch('/api/collys/' + collyId + '/broken', { method: 'POST' });
          });
        });
      `}</Script>

      {/* Download helper */}
      <Script id="download-fn" strategy="afterInteractive">{`
        function downloadfile() {
          fetch('/api/collys/${colly.id}/download', { method: 'POST' });
          window.location.href = '${collyFileUrl}';
        }
      `}</Script>

      {/* View counter increment */}
      <Script id="view-counter" strategy="afterInteractive">{`
        fetch('/api/collys/${colly.id}/view', { method: 'POST' });
      `}</Script>
    </SiteLayout>
  );
}
