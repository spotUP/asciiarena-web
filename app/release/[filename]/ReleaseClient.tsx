"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import {
  trackView, trackDownload,
  addFavourite, removeFavourite,
  reportBroken as reportBrokenAction,
  getComments as fetchComments,
  postComment as postCommentAction,
  editComment as editCommentAction,
  deleteComment as deleteCommentAction,
} from "@/app/actions/collys";

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

interface Comment {
  id: number;
  nick: string;
  time: string;
  comment: string | null;
  rating: number | null;
}

interface Props {
  collyId: number;
  filename: string;
  collyFileUrl: string;
  userNick: string | null;
  isAdmin: boolean;
  isFavourited: boolean;
  initBgColor: string;
  initFgColor: string;
  initFont: string;
  isArchive: boolean;
  fileContent: string;
  type: string;
  collyTitle: string;
  siteUrl: string;
  initialViewCount: number;
}

type Section = null | "add-comment" | "edit-comment" | "broken";

function ColorSwatch({ label, current, onChange }: { label: string; current: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <button className="btn-big" onClick={() => setOpen(o => !o)}>{label}</button>
      <div
        style={{ width: "20px", height: "20px", background: current, border: "1px solid #666", cursor: "pointer", flexShrink: 0 }}
        onClick={() => setOpen(o => !o)}
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 100,
          background: "#222", border: "1px solid #555", padding: "4px",
          display: "grid", gridTemplateColumns: "repeat(8, 20px)", gap: "2px",
        }}>
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.value}
              title={c.label}
              style={{
                width: "20px", height: "20px", background: c.value, cursor: "pointer",
                border: current === c.value ? "2px solid white" : "1px solid #555", padding: 0,
              }}
              onClick={() => { onChange(c.value); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReleaseClient({
  collyId, filename, collyFileUrl, userNick, isAdmin,
  isFavourited, initBgColor, initFgColor, initFont,
  isArchive, fileContent, type, collyTitle, siteUrl,
  initialViewCount,
}: Props) {
  const [collyVisible, setCollyVisible] = useState(true);
  const [bgColor, setBgColor] = useState(initBgColor);
  const [fgColor, setFgColor] = useState(initFgColor);
  const [font, setFont] = useState(initFont);
  const [fitted, setFitted] = useState(false);
  const [fav, setFav] = useState(isFavourited);
  const [section, setSection] = useState<Section>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [copyImageLabel, setCopyImageLabel] = useState("Copy as image");
  const [, startTransition] = useTransition();

  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [brokenText, setBrokenText] = useState("");

  const collyRef = useRef<HTMLPreElement | HTMLDivElement | null>(null);
  const collyDivRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);

  const releaseUrl = `${siteUrl}/release/${filename}`;

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(collyId);
      setComments(data ?? []);
      setCommentsLoaded(true);
    } catch { setCommentsLoaded(true); }
  }, [collyId]);

  useEffect(() => {
    trackView(collyId).then(() => {
      setViewCount(v => v + 1);
    }).catch(() => {});
    loadComments();
    // Recently viewed
    try {
      const key = "recentlyViewed";
      const existing: Array<{ filename: string; name: string }> = JSON.parse(localStorage.getItem(key) ?? "[]");
      const filtered = existing.filter(r => r.filename !== filename);
      localStorage.setItem(key, JSON.stringify([{ filename, name: collyTitle }, ...filtered].slice(0, 10)));
    } catch {}
  }, [collyId, loadComments, filename, collyTitle]);

  // Close share dropdown on outside click
  useEffect(() => {
    if (!shareOpen) return;
    const h = (e: MouseEvent) => { if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [shareOpen]);

  // Close font dropdown on outside click
  useEffect(() => {
    if (!fontOpen) return;
    const h = (e: MouseEvent) => { if (fontRef.current && !fontRef.current.contains(e.target as Node)) setFontOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [fontOpen]);

  // Auto-fit on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && !isArchive) fitColly();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!collyVisible || type !== "ASCII") return;
    const handler = (e: KeyboardEvent) => {
      if (section !== null) return;
      if (e.key === "f") { doFullscreen(); }
      else if (e.key === "d") { doDownload(); }
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        collyDivRef.current?.scrollBy({ top: -200, behavior: "smooth" });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        collyDivRef.current?.scrollBy({ top: 200, behavior: "smooth" });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collyVisible, type, section]);

  const fitColly = () => {
    const pre = collyRef.current;
    const container = collyDivRef.current;
    if (!pre || !container) return;
    if (fitted) {
      (pre as HTMLElement).style.fontSize = "";
      setFitted(false);
    } else {
      const cw = container.clientWidth - 16;
      const pw = pre.scrollWidth;
      if (pw > cw) (pre as HTMLElement).style.fontSize = Math.floor((cw / pw) * 100) + "%";
      setFitted(true);
    }
  };

  const toggleColly = () => {
    setCollyVisible(v => !v);
    setSection(null);
    loadComments();
  };

  const doFullscreen = () => {
    (window as Window & { showFullscreen?: () => void }).showFullscreen?.();
  };

  const doDownload = () => {
    startTransition(() => { trackDownload(collyId); });
    const link = document.createElement("a");
    link.setAttribute("download", "");
    link.href = collyFileUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const doCopyImage = async () => {
    if (!collyRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(collyRef.current as HTMLElement, { backgroundColor: bgColor, scale: 1 });
      canvas.toBlob(blob => {
        if (blob) {
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).catch(() => {});
        }
      });
      setCopyImageLabel("Copied!");
      setTimeout(() => setCopyImageLabel("Copy as image"), 2000);
    } catch {}
  };

  const toggleFav = async () => {
    if (!fav) {
      setFav(true); // optimistic
      const r = await addFavourite(collyId);
      if (!r.success) setFav(false); // roll back
    } else {
      setFav(false); // optimistic
      const r = await removeFavourite(collyId);
      if (!r.success) setFav(true); // roll back
    }
  };

  const startEdit = (comment: Comment) => {
    setEditId(comment.id);
    setEditText(comment.comment ?? "");
    setSection("edit-comment");
    setCollyVisible(false);
  };

  const saveEdit = async () => {
    if (editId === null) return;
    await editCommentAction(collyId, editId, editText);
    setComments(cs => cs.map(c => c.id === editId ? { ...c, comment: editText } : c));
    cancelSection();
  };

  const deleteComment = async (id: number) => {
    const r = await deleteCommentAction(collyId, id);
    if (r.success) loadComments();
  };

  const sendComment = async () => {
    const r = await postCommentAction(collyId, commentText, rating || null);
    if (r.success) {
      setCommentText(""); setRating("");
      setSection(null);
      loadComments();
    }
  };

  const sendBroken = async () => {
    const r = await reportBrokenAction(collyId, brokenText);
    if (r.success) { setBrokenText(""); cancelSection(); }
  };

  const cancelSection = () => {
    setSection(null);
    setCollyVisible(true);
    loadComments();
  };

  const isAnsi = type === "ANSI";

  return (
    <>
      <div id="blacker" style={{ backgroundColor: bgColor }} />

      {/* Controls bar */}
      <div className="bg-secondary amb-1 p-0" style={{ marginTop: "36px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", padding: "4px 8px" }}>
          {!isArchive && (
            <input type="button" className="btn-big" value={collyVisible ? "Hide Colly" : "View Colly"} onClick={toggleColly} />
          )}
          {!isArchive && collyVisible && (
            <input type="button" className="btn-big" id="fsbutton" value="Fullscreen" onClick={doFullscreen} />
          )}
          {!isArchive && collyVisible && (
            <input type="button" className="btn-big" value={fitted ? "Reset size" : "Fit to screen"} onClick={fitColly} />
          )}
          <input type="button" className="btn-big" value="Download" onClick={doDownload} />
          <span className="lightgrey" style={{ padding: "0 4px" }}>{viewCount} views</span>

          {type === "ASCII" && collyVisible && (
            <input type="button" className="btn-big" value={copyImageLabel} onClick={doCopyImage} />
          )}

          {/* Share dropdown */}
          <div ref={shareRef} style={{ position: "relative" }}>
            <button className="btn-big bg-header grey-text" onClick={() => setShareOpen(o => !o)}>
              Share
            </button>
            {shareOpen && (
              <div className="dropdown-menu" style={{ display: "block", position: "absolute", zIndex: 200, top: "100%" }}>
                <a className="dropdown-item" href={`mailto:?Subject=Check out ${collyTitle} at asciiarena.se&Body=Check%20out%20${encodeURIComponent(collyTitle)}%20at%20aSCIIaRENA!%20${encodeURIComponent(releaseUrl)}`}>Mail</a>
                <a className="dropdown-item" href={`http://www.facebook.com/sharer.php?u=${encodeURIComponent(releaseUrl)}`} target="_blank" rel="noreferrer">Facebook</a>
                <a className="dropdown-item" href={`http://reddit.com/submit?url=${encodeURIComponent(releaseUrl)}&title=Check+out+${encodeURIComponent(collyTitle)}+at+asciiarena.se`} target="_blank" rel="noreferrer">Reddit</a>
                <a className="dropdown-item" href={`https://twitter.com/share?url=${encodeURIComponent(releaseUrl)}&text=${encodeURIComponent(`Check out ${collyTitle} at asciiarena.se`)}`} target="_blank" rel="noreferrer">Twitter</a>
              </div>
            )}
          </div>

          {commentsLoaded && comments.length > 0 && (
            <a href="#comments" className="btn-big bg-header apt-1 apb-1 grey-text" role="button">View Comments</a>
          )}

          {userNick && (
            <>
              <input type="button" className="btn-big" value="Add Comment" onClick={() => { setSection("add-comment"); setCollyVisible(false); }} />
              <input type="button" className="btn-big" value={fav ? "Remove favourite" : "Favourite"} onClick={toggleFav} />
              <input type="button" className="btn-big" value="Report Broken" onClick={() => { setSection("broken"); setCollyVisible(false); }} />
              {isAdmin && (
                <a className="btn-big" href={`/admin#colly?getcollyname=${filename}`}>Edit</a>
              )}
            </>
          )}
        </div>

        {/* Color / font controls */}
        {!isArchive && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "4px 8px 8px" }}>
            <ColorSwatch label="BG Color" current={bgColor} onChange={setBgColor} />
            <ColorSwatch label="FG Color" current={fgColor} onChange={setFgColor} />
            <div ref={fontRef} style={{ position: "relative" }}>
              <button className="btn-big bg-header grey-text" onClick={() => setFontOpen(o => !o)}>
                {FONTS.find(f => f.value === font)?.label ?? font} v
              </button>
              {fontOpen && (
                <div className="dropdown-menu ascii" style={{ display: "block", position: "absolute", zIndex: 200, top: "100%" }}>
                  {FONTS.map(f => (
                    <button key={f.value} className="dropdown-item ascii" onClick={() => { setFont(f.value); setFontOpen(false); }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ASCII viewer */}
      {type === "ASCII" && collyVisible && (
        <div
          ref={collyDivRef}
          id="colly-div"
          style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "scroll", overflowX: "hidden", height: "100vh", backgroundColor: bgColor, margin: 0, padding: 0 }}
        >
          <pre
            ref={collyRef as React.RefObject<HTMLPreElement>}
            id="colly"
            style={{ overflow: "hidden", fontFamily: font, color: fgColor, whiteSpace: "pre" }}
            dangerouslySetInnerHTML={{ __html: "<br><br><br><br>" + fileContent + "<br><br><br><br>" }}
          />
        </div>
      )}

      {/* ANSI viewer — filled by external ansilove.js Script */}
      {isAnsi && collyVisible && (
        <div
          ref={collyDivRef}
          id="colly-div"
          style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundColor: "#000", overflowX: "hidden", margin: 0, padding: 0 }}
        >
          <span id="loading" style={{ animation: "blink 2s linear infinite" }}>.LOADiNG.</span>
          <div
            ref={collyRef as React.RefObject<HTMLDivElement>}
            id="colly"
            style={{ paddingTop: "64px" }}
          />
        </div>
      )}

      {/* Comments list */}
      <div id="comments">
        {commentsLoaded && comments.length > 0 && comments.map(c => (
          <div key={c.id}>
            <div className="header bg-header col-12 ap-1 text-truncate">
              <span> BY:</span><span className="yellow">{c.nick}</span>
              <span> DATE:</span><span className="white">{c.time}</span>
              {c.rating != null && <><span className="yellow"> RATING:</span><span className="white"> {c.rating}</span></>}
            </div>
            <div className="bg-secondary col-12 ap-1 amb-1">
              <span className="cyan" style={{ whiteSpace: "pre-wrap" }}>
                {c.comment ?? `${c.nick} voted ${c.rating}`}
              </span>
              <div className="col-12 p-0 m-0 apt-1">
                {isAdmin && (
                  <>
                    <input type="button" className="btn-big" value="Edit" onClick={() => startEdit(c)} />
                    <input type="button" className="btn-big" value="Delete" onClick={() => deleteComment(c.id)} />
                  </>
                )}
                {!isAdmin && userNick && c.nick === userNick && (
                  <input type="button" className="btn-big" value="Edit" onClick={() => startEdit(c)} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment form */}
      {section === "add-comment" && (
        <div>
          <div className="row apl-1 apr-1">
            <div className="header bg-header col-12 ap-1">ENTER YOUR COMMENT</div>
          </div>
          <div className="row">
            <div className="col-12 aml-1 amr-1">
              <textarea
                style={{ height: "128px", width: "100%" }}
                className="bg-secondary cyan ap-1"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
            </div>
          </div>
          <div className="row aml-1 apl-1 apr-1">
            <div className="col-12 apl-1 apr-1 apb-1 apt-1 bg-secondary">
              <div className="col-2 d-flex justify-content-between">
                <label className="apr-1" htmlFor="user_rating">RATING</label>
                <select id="user_rating" className="form-select" value={rating} onChange={e => setRating(e.target.value)}>
                  <option value="">Blank</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="col-12 p-0 m-0 apt-1">
                <input type="button" className="btn-big" value="Comment" onClick={sendComment} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit comment form */}
      {section === "edit-comment" && (
        <div>
          <div className="row"><div className="col-12 apb-1"><span className="white">Edit Your Comment...</span></div></div>
          <div className="row">
            <div className="col-12">
              <textarea rows={5} className="w-100" value={editText} onChange={e => setEditText(e.target.value)} />
            </div>
            <div className="col-12 apt-1">
              <input type="button" className="btn-big" value="Cancel" onClick={cancelSection} />
              <input type="button" className="btn-big" value="Save" onClick={saveEdit} />
            </div>
          </div>
        </div>
      )}

      {/* Report broken form */}
      {section === "broken" && (
        <div className="container-fluid bg-secondary amb-1 apb-1">
          <div className="row"><div className="col-12 amt-1"><span className="white">DESCRiBE THE PROBLEM</span></div></div>
          <div className="row"><div className="col-12 amt-1 amb-1">
            <textarea className="w-100" style={{ height: "64px" }} value={brokenText} onChange={e => setBrokenText(e.target.value)} />
          </div></div>
          <div className="row">
            <div className="col-12">
              <input type="button" className="btn-big" value="Cancel" onClick={cancelSection} />
              <input type="button" className="btn-big" value="Report" onClick={sendBroken} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
