import { readFileSync, existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Script from "next/script";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { urlsafe, formatBytes } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface PageProps {
  params: Promise<{ filename: string }>;
}

// Matches PHP's encodeFileText() — handles Latin-1/CP437 ASCII art files
function encodeFileText(filePath: string): string {
  const buf = readFileSync(filePath);
  let text: string;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    text = decoder.decode(buf);
  } catch {
    // Not valid UTF-8 — treat as Latin-1 (ISO-8859-1), same as PHP's utf8_encode()
    text = Array.from(buf as Uint8Array).map(b => String.fromCharCode(b)).join("");
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const MONTHS = [
  "Unknown", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLOR_OPTIONS = [
  { value: "#555555", label: "Bright Black" },
  { value: "#5555ff", label: "Bright Blue" },
  { value: "#ff55ff", label: "Bright Magenta" },
  { value: "#ff5555", label: "Bright Red" },
  { value: "#ffff55", label: "Bright Yellow" },
  { value: "#55ff55", label: "Bright Green" },
  { value: "#55FFFF", label: "Bright Cyan" },
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#0000aa", label: "Blue" },
  { value: "#aa00aa", label: "Magenta" },
  { value: "#aa0000", label: "Red" },
  { value: "#aa5500", label: "Yellow" },
  { value: "#00aa00", label: "Green" },
  { value: "#00aaaa", label: "Cyan" },
  { value: "#aaaaaa", label: "Grey" },
];

const FONTS = [
  { value: "MicroKnight", label: "MicroKnight" },
  { value: "MicroKnightPlus", label: "MicroKnight+" },
  { value: "mOsOul", label: "mOsOul" },
  { value: "P0T-NOoDLE", label: "P0T-NOoDLE" },
  { value: "Topaz_a500", label: "A500 Topaz" },
  { value: "TopazPlus_a500", label: "A500 Topaz+" },
  { value: "Topaz_a1200", label: "A1200 Topaz" },
  { value: "TopazPlus_a1200", label: "A1200 Topaz+" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { filename: rawFilename } = await params;
  const filename = rawFilename.replace(/\.\./g, "").replace(/[/\\]/g, "");

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
  const filename = rawFilename.replace(/\.\./g, "").replace(/[/\\]/g, "");

  const colly = await prisma.collys.findFirst({ where: { filename } });
  if (!colly) notFound();

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const userNick = session?.user?.name ?? "";
  const isAdmin = session?.user?.rank === "Admin";

  // Check favourite
  let isFavourited = false;
  if (userId) {
    const fav = await prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM favourites WHERE user_id = ${userId} AND colly_id = ${colly.id} LIMIT 1`
    );
    isFavourited = fav.length > 0;
  }

  // Artists and crews
  const artistRows = await prisma.artists_collys.findMany({
    where: { colly_id: colly.id },
    include: { artists: true },
    orderBy: { sortorder: "asc" },
  });
  const artists = artistRows.map(r => r.artists).filter(Boolean);

  const crewRows = await prisma.collys_crews.findMany({
    where: { colly_id: colly.id },
    include: { crews: true },
    orderBy: { sortorder: "asc" },
  });
  const crews = crewRows.map(r => r.crews).filter(Boolean);

  // Rating
  const voteCount = await prisma.comments.count({ where: { colly_id: colly.id, rating: { gt: 0 } } });
  const ratingDisplay = (colly.rating && colly.rating > 0)
    ? `${Number(colly.rating).toFixed(1)} (${voteCount} votes)`
    : `Awaiting ${Math.max(0, 3 - voteCount)} vote${Math.max(0, 3 - voteCount) !== 1 ? "s" : ""}`;

  // File paths
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  const filePath = path.join(collectionsPath, dirname, filename);
  const dizPath = `${filePath}.diz`;
  const fallbackDizPath = path.join(collectionsPath, "file_id.diz.txt");
  const type = (colly.type ?? "ASCII").toUpperCase();

  // .diz file preview for summary card
  let dizContent = "";
  if (existsSync(dizPath)) {
    try { dizContent = encodeFileText(dizPath); } catch { dizContent = ""; }
  } else if (existsSync(fallbackDizPath)) {
    try { dizContent = encodeFileText(fallbackDizPath); } catch { dizContent = ""; }
  }

  // ASCII file content
  let fileContent = "";
  if (type === "ASCII" && existsSync(filePath)) {
    try { fileContent = encodeFileText(filePath); } catch { fileContent = ""; }
  }

  // User viewer preferences
  let font = "mOsOul";
  let fgcolor = "#FF55FF";
  let bgcolor = "#111111";
  if (userId) {
    const prefs = await prisma.users.findFirst({
      where: { id: userId },
      select: { def_font: true, def_fg_col: true, def_bg_col: true },
    });
    if (prefs) {
      if (prefs.def_font && prefs.def_font.length > 1) font = prefs.def_font;
      if (prefs.def_fg_col && prefs.def_fg_col.length > 1) fgcolor = prefs.def_fg_col;
      if (prefs.def_bg_col && prefs.def_bg_col.length > 1) bgcolor = prefs.def_bg_col;
    }
  }

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
      <div id="blacker" style={{ backgroundColor: bgcolor }} />

      {/* Summary card — matches info_release_summary.php */}
      <div className="row">
        <div className="header col-lg-12">
          <h1 className="ap-1 bg-header">{colly.name ?? colly.filename}</h1>
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
          <div className="col-lg-4">
            <div className="row d-flex justify-content-between">
              <span>Artist(s):</span>
              <span>
                {artists.length > 0
                  ? artists.map((a, i) => (
                    <span key={a?.id ?? i}>
                      {i > 0 && " & "}
                      <a className="green" href={`/artist/${urlsafe(a?.nick ?? "")}`}>{a?.nick}</a>
                    </span>
                  ))
                  : "-"}
              </span>
            </div>
            {crews.length > 0 && (
              <div className="row d-flex justify-content-between">
                <span>Crew(s):</span>
                <span>
                  {crews.map((c, i) => (
                    <span key={c?.id ?? i}>
                      {i > 0 && " & "}
                      <a href={`/crew/${urlsafe(c?.name ?? "")}`}>{c?.name}</a>
                    </span>
                  ))}
                </span>
              </div>
            )}
            <div className="row d-flex justify-content-between">
              <span>Filename:</span>
              <span>{colly.filename}</span>
            </div>
            <div className="row d-flex justify-content-between">
              <span>Size:</span>
              <span>{colly.filesize != null ? formatBytes(Number(colly.filesize)) : "-"}</span>
            </div>
            {showDate && (
              <div className="row d-flex justify-content-between">
                <span>Released:</span>
                <span>{[day, month, year].filter(Boolean).join(" ")}</span>
              </div>
            )}
            <div className="row d-flex justify-content-between">
              <span>Rating:</span>
              <span>{ratingDisplay}</span>
            </div>
            <div className="row d-flex justify-content-between">
              <span>Added by:</span>
              <span><a href={`/member/${urlsafe(colly.uploader ?? "")}`}>{colly.uploader}</a></span>
            </div>
            <div className="row d-flex justify-content-between">
              <span>Viewed:</span>
              <span>{colly.view_counter ?? 0} times</span>
            </div>
            <div className="row d-flex justify-content-between">
              <span>Downloaded:</span>
              <span>{downloads} Time{downloads !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="container-fluid bg-secondary amb-1 p-0" style={{ marginTop: "36px" }}>
        {!isArchive && (
          <input type="button" id="viewbutton" onClick={undefined} className="btn-big amb-1 aml-1" value="Hide Colly" />
        )}
        {!isArchive && (
          <input type="button" id="fsbutton" onClick={undefined} className="btn-big amb-1" value="Fullscreen" />
        )}
        {!isArchive && (
          <input type="button" id="fitbutton" onClick={undefined} className="btn-big amb-1" value="Fit to screen" />
        )}
        <input type="button" onClick={undefined} className="btn-big amb-1" value="Download" id="download-btn" />
        <input type="hidden" id="collyid" data-id={collyId} />

        {/* Share dropdown */}
        <div className="btn-group">
          <button
            id="btnGroupDrop1"
            type="button"
            className="btn-big bg-header grey-text amb-1 dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Share{" "}
          </button>
          <div className="dropdown-menu" aria-labelledby="btnGroupDrop1">
            {(() => {
              const siteUrl = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";
              const releaseUrl = `${siteUrl}/release/${filename}`;
              const title = colly.name ?? filename;
              return (<>
                <a className="dropdown-item" href={`mailto:?Subject=Check out ${title} at asciiarena.se&Body=Check%20out%20${encodeURIComponent(title)}%20at%20aSCIIaRENA!%20${encodeURIComponent(releaseUrl)}`}>Mail</a>
                <a className="dropdown-item" href={`http://www.facebook.com/sharer.php?u=${encodeURIComponent(releaseUrl)}`} target="_blank" rel="noreferrer">Facebook</a>
                <a className="dropdown-item" href={`http://reddit.com/submit?url=${encodeURIComponent(releaseUrl)}&title=Check+out+${encodeURIComponent(title)}+at+asciiarena.se`} target="_blank" rel="noreferrer">Reddit</a>
                <a className="dropdown-item" href={`https://twitter.com/share?url=${encodeURIComponent(releaseUrl)}&text=${encodeURIComponent(`Check out ${title} at asciiarena.se`)}`} target="_blank" rel="noreferrer">Twitter</a>
              </>);
            })()}
          </div>
        </div>

        <a id="viewcomment" href="#comments" className="btn-big amb-1 bg-header text apt-1 apb-1 grey-text" role="button">View Comments</a>

        {userId && (
          <>
            <input type="button" className="btn-big amb-1" id="addcomment-btn" value="Add Comment" />
            <input
              type="button"
              id="favbutton"
              className="btn-big amb-1"
              value={isFavourited ? "Remove favourite" : "Favourite"}
            />
            <input type="button" className="btn-big amb-1" id="broken-btn" value="Report Broken" />
            {isAdmin && (
              <a className="btn-big amb-1" href={`/admin#colly?getcollyname=${filename}`}>Edit</a>
            )}
          </>
        )}

        {/* Colour / font controls */}
        <div id="colly-main" style={isArchive ? { display: "none" } : {}}>
          <div className="container-fluid aml-1">
            <div className="row apb-0 apt-0 apl-0 bg-secondary">
              <button className="btn-primary">BG Color</button>
              <span className="amr-2">
                <select className="custom-select" id="colorselector_1">
                  <option style={{ display: "none" }} id="selcol-1" selected value={bgcolor} data-color={bgcolor} />
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.value} value={c.value} data-color={c.value}>{c.label}</option>
                  ))}
                </select>
              </span>
              <button className="btn-primary">FG Color</button>
              <span className="amr-2">
                <select className="custom-select" id="colorselector_2">
                  <option id="selcol-2" selected value={fgcolor} data-color={fgcolor} />
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.value} value={c.value} data-color={c.value}>{c.label}</option>
                  ))}
                </select>
              </span>
              <div className="col-2 amb-1 m-0 p-0">
                <select className="select2" id="colly-font">
                  {FONTS.map(f => (
                    <option key={f.value} value={f.value} selected={f.value === font}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ASCII viewer */}
      {type === "ASCII" && (
        <div
          className="row ml-0 mr-0 amb-1 p-0 justify-content-center align-items-center"
          style={{ overflowY: "scroll", overflowX: "hidden", height: "100vh", backgroundColor: bgcolor }}
          id="colly-div"
        >
          <pre
            id="colly"
            style={{ overflow: "hidden", fontFamily: font, color: fgcolor, whiteSpace: "pre" }}
            dangerouslySetInnerHTML={{ __html: "<br><br><br><br>" + fileContent + "<br><br><br><br>" }}
          />
        </div>
      )}

      {/* ANSI viewer */}
      {type === "ANSI" && (
        <>
          <div
            className="row ml-0 mr-0 amb-1 p-0 justify-content-center align-items-center"
            style={{ backgroundColor: "#000", overflowX: "hidden" }}
            id="colly-div"
          >
            <span id="loading" style={{ animation: "blink 2s linear infinite" }}>.LOADiNG.</span>
            <div id="colly" style={{ paddingTop: "64px" }} />
          </div>
          <Script src="/assets/js/ansilove.js" strategy="afterInteractive" />
          <Script id="ansi-render" strategy="afterInteractive">{`
            AnsiLove.splitRender("${collyFileUrl}", function(canvases) {
              canvases.forEach(function(canvas) {
                canvas.style.verticalAlign = "bottom";
                canvas.style.margin = "0 auto";
                canvas.style.display = "block";
                document.getElementById("colly").appendChild(canvas);
              });
              document.getElementById("loading").style.display = "none";
            }, 100, {"font": "mosoul", "bits": "8", "icecolors": 1, "columns": 80, "thumbnail": 0, "filetype": "ans"});
          `}</Script>
        </>
      )}

      {/* Comments section */}
      <div id="comments"></div>

      {/* Add comment form */}
      <div id="addcomment" style={{ display: "none" }}>
        <div className="row apl-1 apr-1">
          <div className="header bg-header col-12 ap-1">ENTER YOUR COMMENT</div>
        </div>
        <div className="row">
          <div className="col-12 aml-1 amr-1">
            <textarea style={{ height: "128px", width: "100%" }} className="bg-secondary cyan ap-1" id="user_comment" />
          </div>
        </div>
        <div className="row aml-1 apl-1 apr-1">
          <div className="col-12 apl-1 apr-1 apb-1 apt-1 bg-secondary">
            <div className="col-2 d-flex justify-content-between">
              <label className="apr-1" htmlFor="user_rating">RATING</label>
              <select id="user_rating" className="custom-select">
                <option value="">Blank</option>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="col-12 p-0 m-0 apt-1">
              <input type="button" className="btn-big" id="send-comment-btn" value="Comment" />
            </div>
          </div>
        </div>
      </div>

      {/* Edit comment form */}
      <div id="editcomment" style={{ display: "none" }}>
        <div className="row"><div className="col-12 apb-1"><span className="white">Edit Your Comment...</span></div></div>
        <div className="row">
          <div className="col-12">
            <textarea rows={5} className="w-100" id="user_edit_comment" />
            <input type="hidden" id="user_edit_comment_id" />
          </div>
          <div className="col-12 apt-1">
            <input type="button" className="btn-big" id="cancel-edit-btn" value="Cancel" />
            <input type="button" className="btn-big" id="save-edit-btn" value="Save" />
          </div>
        </div>
      </div>

      {/* Report broken form */}
      <div id="reportbroken" style={{ display: "none" }}>
        <div className="container-fluid bg-secondary amb-1 apb-1">
          <div className="row"><div className="col-12 amt-1"><span className="white">DESCRiBE THE PROBLEM</span></div></div>
          <div className="row"><div className="col-12 amt-1 amb-1"><textarea className="w-100" style={{ height: "64px" }} id="broken_comment" /></div></div>
          <div className="row">
            <div className="col-12">
              <input type="button" className="btn-big" id="cancel-broken-btn" value="Cancel" />
              <input type="button" className="btn-big" id="send-broken-btn" value="Report" />
            </div>
          </div>
        </div>
      </div>

      {/* All JavaScript — matches PHP info_release.php exactly */}
      <Script id="release-js" strategy="afterInteractive">{`
        var _collyId = ${collyId};
        var _filename = ${JSON.stringify(filename)};
        var _dirname = ${JSON.stringify(dirname)};
        var _collyFileUrl = ${JSON.stringify(collyFileUrl)};
        var _userNick = ${JSON.stringify(userNick)};
        var _isAdmin = ${isAdmin ? "true" : "false"};

        function htmlEncode(s) { return $('<div>').text(s).html(); }

        function showAlert(content, prependTo) {
          const alertContent = '<div class="animate__animated animate__shakeX alert alert-success">'+content+'</div>';
          $(prependTo).prepend(alertContent).children().first().delay(2000).slideUp();
        }

        function addComment() {
          $('#reportbroken').hide(500);
          $('#comments').show(500);
          $('#addcomment').show(500);
          $('#editcomment').hide(500);
          $('#user_comment').focus();
          $('#user_comment')[0].scrollIntoView(true);
        }

        function reportAsBroken() {
          $('#viewbutton').val('View Colly');
          $('#fsbutton').hide(100);
          $('#colly-main').hide(500);
          $('#colly').hide(500);
          $('#comments').hide(500);
          $('#addcomment').hide(500);
          $('#editcomment').hide(500);
          $('#reportbroken').show(500);
          $('#broken_comment').focus();
        }

        function cancelBroken() {
          $('#addcomment').hide(500);
          $('#editcomment').hide(500);
          $('#reportbroken').hide(500);
          if ($('#viewbutton').val() == 'View Colly') {
            $('#colly-main').fadeIn(500); $('#colly-div').fadeIn(500);
            $('#viewbutton').val('Hide Colly'); $('#fsbutton').show(100);
          } else {
            $('#colly-main').fadeOut(500); $('#colly-div').fadeOut(500);
            $('#viewbutton').val('View Colly'); $('#fsbutton').hide(100);
          }
          $('#comments').show(500);
          getComments();
        }

        function toggleColly() {
          $('#addcomment').hide(500); $('#editcomment').hide(500); $('#reportbroken').hide(500);
          if ($('#viewbutton').val() == 'View Colly') {
            $('#colly-main').fadeIn(500); $('#colly-div').fadeIn(500);
            $('#viewbutton').val('Hide Colly'); $('#fsbutton').show(100);
          } else {
            $('#colly-main').fadeOut(500); $('#colly-div').fadeOut(500);
            $('#viewbutton').val('View Colly'); $('#fsbutton').hide(100);
          }
          $('#comments').show(500);
          getComments();
        }

        function editComment(commentid) {
          $('#viewbutton').val('View Colly'); $('#fsbutton').hide(100);
          $('#colly-main').hide(500); $('#colly').hide(500); $('#reportbroken').hide(500);
          $('#comments').hide(500); $('#addcomment').hide(500); $('#editcomment').show(500);
          $('#user_edit_comment').val($('#comment'+commentid).text());
          $('#user_edit_comment_id').val(commentid);
          $('#user_edit_comment').focus();
        }

        function downloadfile() {
          fetch('/api/collys/'+_collyId+'/download', {method:'POST'});
          var link = document.createElement('a');
          link.setAttribute('download', '');
          link.href = _collyFileUrl;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }

        function favourite() {
          if ($('#favbutton').val() == 'Favourite') {
            $('#favbutton').val('Remove favourite');
            fetch('/api/collys/'+_collyId+'/favourites', {method:'POST'})
              .then(function(r){return r.json();})
              .then(function(d){ if(d.status===true) showAlert('Added '+_filename+' as favourite!','#messages'); });
          } else {
            $('#favbutton').val('Favourite');
            fetch('/api/collys/'+_collyId+'/favourites', {method:'DELETE'})
              .then(function(r){return r.json();})
              .then(function(d){ if(d.status===true) showAlert('Removed '+_filename+' from favourites!','#messages'); });
          }
        }

        function sendBrokenReport() {
          fetch('/api/collys/'+_collyId+'/broken', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({comment: $('#broken_comment').val()})
          }).then(function(r){return r.json();}).then(function(d){
            if(d.status===true){ $('#broken_comment').val(''); showAlert('Reported '+_filename+' as broken!','#messages'); }
          });
        }

        function sendComment() {
          fetch('/api/collys/'+_collyId+'/comments', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({comment: $('#user_comment').val(), rating: $('#user_rating').val()||null})
          }).then(function(r){return r.json();}).then(function(d){
            if(d.status===true){ showAlert('Comment added!','#messages'); $('#user_comment').val(''); $('#addcomment').hide(500); getComments(); }
          });
        }

        function sendEditedComment() {
          var commentid = $('#user_edit_comment_id').val();
          fetch('/api/collys/'+_collyId+'/comments/'+commentid, {
            method:'PATCH', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({comment: $('#user_edit_comment').val()})
          }).then(function(){
            $('#comment'+commentid).text($('#user_edit_comment').val());
            cancelBroken();
          });
        }

        function deleteComment(commentid) {
          fetch('/api/collys/'+_collyId+'/comments/'+commentid+'?colly_id='+_collyId, {method:'DELETE'})
            .then(function(r){return r.json();}).then(function(d){
              if(d.status===true){ getComments(); showAlert('Comment deleted!','#messages'); }
            });
        }

        function getComments() {
          var commentlist = $('#comments');
          commentlist.empty();
          fetch('/api/collys/'+_collyId+'/comments')
            .then(function(r){return r.json();})
            .then(function(data){
              if(data.length===0){ $('#viewcomment').hide(); return; }
              $('#viewcomment').show();
              data.forEach(function(comment){
                var buttons = '';
                if(_isAdmin){
                  buttons = '<input type="button" class="btn-big" onclick="editComment('+comment.id+')" value="Edit"><input type="button" onclick="deleteComment('+comment.id+')" class="btn-big" value="Delete">';
                } else if(_userNick && comment.nick===_userNick){
                  buttons = '<input type="button" class="btn-big" onclick="editComment('+comment.id+')" value="Edit">';
                }
                var ratingHtml = comment.rating ? '<span class="yellow">RATING:</span><span class="white"> '+comment.rating+'</span>' : '';
                commentlist.append(
                  '<div class="header bg-header col-12 ap-1 text-truncate"><span> BY:</span><span class="yellow">'+htmlEncode(comment.nick)+'</span><span> DATE:</span><span class="white">'+comment.time+'</span>'+ratingHtml+'</div>'+
                  '<div class="bg-secondary col-12 ap-1 amb-1"><span id="comment'+comment.id+'" class="cyan" style="white-space:pre-wrap">'+htmlEncode(comment.comment||comment.nick+' voted '+comment.rating)+'</span><div class="col-12 p-0 m-0 apt-1">'+buttons+'</div></div>'
                );
              });
            });
        }

        $(function() {
          // View counter
          fetch('/api/collys/'+_collyId+'/view', {method:'POST'});
          getComments();

          // Colour selectors
          if(typeof $.fn.colorselector === 'function'){
            $('#colorselector_1').colorselector({callback:function(value,color){
              $('#colly').css('background-color',color);
              $('#colly-div').css('background-color',color);
              $('#blacker').css('background-color',color);
            }});
            $('#colorselector_2').colorselector({callback:function(value,color){
              $('#colly').css('color',color);
            }});
          }
          $('#colly-font').on('change',function(){ $('#colly').css('font-family',$(this).val()); });

          // Button handlers
          // Fit-to-screen toggle
          function fitColly() {
            var pre = document.getElementById('colly');
            var container = document.getElementById('colly-div');
            if (!pre || !container) return;
            if (pre.getAttribute('data-fitted') === '1') {
              pre.style.fontSize = '';
              pre.setAttribute('data-fitted', '0');
              $('#fitbutton').val('Fit to screen');
            } else {
              var cw = container.clientWidth - 16;
              var pw = pre.scrollWidth;
              if (pw > cw) {
                pre.style.fontSize = Math.floor((cw / pw) * 100) + '%';
              }
              pre.setAttribute('data-fitted', '1');
              $('#fitbutton').val('Reset size');
            }
          }
          // Auto-fit on mobile portrait
          if (window.innerWidth < 768) { fitColly(); }
          window.addEventListener('resize', function() {
            var pre = document.getElementById('colly');
            if (pre && pre.getAttribute('data-fitted') === '1') {
              pre.style.fontSize = '';
              pre.setAttribute('data-fitted', '0');
              fitColly();
            }
          });

          $('#viewbutton').on('click', toggleColly);
          $('#fitbutton').on('click', fitColly);
          $('#fsbutton').on('click', showFullscreen);
          $('#download-btn').on('click', downloadfile);
          $('#addcomment-btn').on('click', addComment);
          $('#favbutton').on('click', favourite);
          $('#broken-btn').on('click', reportAsBroken);
          $('#cancel-edit-btn').on('click', cancelBroken);
          $('#save-edit-btn').on('click', sendEditedComment);
          $('#cancel-broken-btn').on('click', cancelBroken);
          $('#send-broken-btn').on('click', sendBrokenReport);
          $('#send-comment-btn').on('click', sendComment);
        });
      `}</Script>
    </SiteLayout>
  );
}
