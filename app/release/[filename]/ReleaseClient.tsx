"use client";

import { useState, useEffect, useCallback, useRef, useTransition, useMemo } from "react";
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

interface LogoSection { startLine: number; endLine: number; lineCount: number }

function detectLogoSections(html: string): LogoSection[] {
  const text = html.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const lines = text.split("\n");
  // Normalize a line to its shape: replace every non-space char with '#', trim trailing spaces.
  // Two lines with the same frame art produce the same fingerprint regardless of interior text.
  const norm = (s: string) => s.replace(/[^\s]/g, "#").trimEnd();

  interface Island { startLine: number; endLine: number; lineCount: number; fp: string }
  const islands: Island[] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    const start = i;
    while (i < lines.length && lines[i].trim() !== "") i++;
    const lineCount = i - start;
    if (lineCount >= 5) {
      // Fingerprint = normalized first + last line. Divider frames repeat across the colly;
      // logos are each unique, so unique fingerprint → logo, repeated fingerprint → divider.
      const fp = norm(lines[start]) + "|" + norm(lines[i - 1]);
      islands.push({ startLine: start, endLine: i - 1, lineCount, fp });
    }
  }

  // Count fingerprint occurrences — any that appear 2+ times are the repeating divider template.
  const fpCount = new Map<string, number>();
  islands.forEach(isl => fpCount.set(isl.fp, (fpCount.get(isl.fp) ?? 0) + 1));

  return islands
    .filter(isl => (fpCount.get(isl.fp) ?? 0) < 2)
    .map(({ startLine, endLine, lineCount }) => ({ startLine, endLine, lineCount }));
}

interface LogoIndexEntry { section: LogoSection; label: string }

// Frame lines use ≤2 distinct non-space chars (e.g. "mmMMMMMMMMMMMMMmm" = {m,M}).
// Content lines have ≥3 distinct non-space chars.
function extractDividerLabel(divLines: string[]): string {
  const contentLines = divLines.filter(l => {
    const nonSpace = l.replace(/\s/g, "");
    return nonSpace.length >= 2 && new Set(nonSpace).size >= 3;
  });
  if (!contentLines.length) return "";

  // Collapse spaced-letter sequences: "s u b l i m e" -> "sublime"
  const compact = (s: string) => {
    s = s.replace(/ {2,}/g, " ");
    let prev: string;
    do { prev = s; s = s.replace(/([a-zA-Z0-9_]) ([a-zA-Z0-9_])/g, "$1$2"); } while (s !== prev);
    return s.trim();
  };
  const strip = (s: string) =>
    s.replace(/^[^a-zA-Z0-9]+/, "").replace(/[^a-zA-Z0-9]+$/, "").trim();

  // Prefer colon lines: "logo_name : sublime" or "|: ..domination.. :|"
  for (const line of contentLines) {
    let idx = -1;
    while ((idx = line.indexOf(":", idx + 1)) >= 0) {
      const label = compact(strip(line.slice(idx + 1)));
      if (label.replace(/[^a-zA-Z]/g, "").length >= 2) return label.slice(0, 36);
    }
  }

  // Fallback: first content line with actual letters
  for (const line of contentLines) {
    const label = compact(strip(line));
    if (label.replace(/[^a-zA-Z]/g, "").length >= 2) return label.slice(0, 36);
  }
  return "";
}

function buildLogoIndex(html: string, sections: LogoSection[]): LogoIndexEntry[] {
  if (!sections.length) return [];
  const text = html.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const lines = text.split("\n");

  interface RawIsland { startLine: number; endLine: number }
  const all: RawIsland[] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    const start = i;
    while (i < lines.length && lines[i].trim() !== "") i++;
    all.push({ startLine: start, endLine: i - 1 });
  }

  return sections.map((section, n) => {
    const preceding = all
      .filter(isl => isl.endLine < section.startLine)
      .sort((a, b) => b.endLine - a.endLine)[0];
    let label = "";
    if (preceding) label = extractDividerLabel(lines.slice(preceding.startLine, preceding.endLine + 1));
    return { section, label: label || `Logo ${n + 1}` };
  });
}

function animateScroll(
  el: HTMLElement, target: number, duration: number, onComplete?: () => void
): number {
  const from = el.scrollTop;
  const delta = target - from;
  const t0 = performance.now();
  const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let raf: number;
  const tick = (now: number) => {
    const p = Math.min((now - t0) / duration, 1);
    el.scrollTop = from + delta * ease(p);
    if (p < 1) { raf = requestAnimationFrame(tick); } else { onComplete?.(); }
  };
  raf = requestAnimationFrame(tick);
  return raf;
}

function ColorSwatch({ current, onChange }: { current: string; onChange: (v: string) => void }) {
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "8px", height: "16px", background: current, border: "none", padding: 0, cursor: "pointer", display: "block" }}
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const [autoplay, setAutoplay] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState(0);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayRafRef   = useRef<number | null>(null);
  const isAutoScrolling  = useRef(false);

  const sections  = useMemo(() => detectLogoSections(fileContent), [fileContent]);
  const logoIndex = useMemo(() => buildLogoIndex(fileContent, sections), [fileContent, sections]);
  const [indexOpen, setIndexOpen] = useState(false);

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

  // Exit fullscreen on Escape — only when active
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const stopAutoplay = useCallback(() => {
    setAutoplay(false);
    setAutoplayIndex(0);
    if (autoplayTimerRef.current) { clearTimeout(autoplayTimerRef.current); autoplayTimerRef.current = null; }
    if (autoplayRafRef.current)   { cancelAnimationFrame(autoplayRafRef.current); autoplayRafRef.current = null; }
    isAutoScrolling.current = false;
  }, []);

  const startAutoplay = useCallback(() => {
    document.documentElement.scrollTop = 0;
    setIsFullscreen(true);
    setAutoplayIndex(0);
    setAutoplay(true);
  }, []);

  const scrollToSection = useCallback((section: LogoSection) => {
    const pre = collyRef.current as HTMLElement | null;
    if (!pre) return;
    const lineHeight = parseFloat(getComputedStyle(pre).lineHeight) || 16;
    const SPACERS    = 4;
    const sectionTop = (SPACERS + section.startLine) * lineHeight;
    const sectionH   = section.lineCount * lineHeight;
    if (isFullscreen) {
      const viewH  = window.innerHeight;
      const target = Math.max(0, Math.min(sectionTop - (viewH - sectionH) / 2, document.documentElement.scrollHeight - viewH));
      animateScroll(document.documentElement, target, 500);
    } else {
      const container = collyDivRef.current;
      if (!container) return;
      const viewH  = container.clientHeight;
      const target = Math.max(0, Math.min(sectionTop - (viewH - sectionH) / 2, container.scrollHeight - viewH));
      animateScroll(container, target, 500);
    }
  }, [isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!collyVisible || type !== "ASCII") return;
    const handler = (e: KeyboardEvent) => {
      if (section !== null) return;
      if (e.key === "f") { setIsFullscreen(f => !f); }
      else if (e.key === "d") { doDownload(); }
      else if (e.key === "p") { autoplay ? stopAutoplay() : (startAutoplay()); }
      else if (e.key === "i") { setIndexOpen(o => !o); }
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
  }, [collyVisible, type, section, autoplay, stopAutoplay, startAutoplay, setIndexOpen]);

  useEffect(() => {
    if (!autoplay || !collyVisible) return;
    if (autoplayIndex >= sections.length) { stopAutoplay(); return; }

    const logoSection = sections[autoplayIndex];
    const pre         = collyRef.current as HTMLElement | null;
    if (!pre) return;

    const lineHeight = parseFloat(getComputedStyle(pre).lineHeight) || 16;
    const SPACERS    = 4;
    const sectionTop = (SPACERS + logoSection.startLine) * lineHeight;
    const sectionH   = logoSection.lineCount * lineHeight;

    let scrollEl: HTMLElement;
    let viewH: number;
    let maxScroll: number;
    if (isFullscreen) {
      scrollEl  = document.documentElement;
      viewH     = window.innerHeight;
      maxScroll = document.documentElement.scrollHeight - viewH;
    } else {
      const container = collyDivRef.current;
      if (!container) return;
      scrollEl  = container;
      viewH     = container.clientHeight;
      maxScroll = container.scrollHeight - viewH;
    }

    const target   = Math.max(0, Math.min(sectionTop - (viewH - sectionH) / 2, maxScroll));
    const hold     = Math.min(4000 + Math.max(0, logoSection.lineCount - 20) * 15, 8000);
    const scrollMs = 700;

    if (autoplayRafRef.current)   cancelAnimationFrame(autoplayRafRef.current);
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);

    isAutoScrolling.current = true;
    autoplayRafRef.current = animateScroll(scrollEl, target, scrollMs, () => {
      isAutoScrolling.current = false;
      autoplayRafRef.current  = null;
    });

    autoplayTimerRef.current = setTimeout(() => {
      autoplayTimerRef.current = null;
      setAutoplayIndex(i => i + 1);
    }, scrollMs + hold);

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (autoplayRafRef.current)   cancelAnimationFrame(autoplayRafRef.current);
      isAutoScrolling.current = false;
    };
  }, [autoplay, autoplayIndex, collyVisible, sections, stopAutoplay, isFullscreen]);

  useEffect(() => {
    if (!autoplay) return;
    const onScroll = () => { if (!isAutoScrolling.current) stopAutoplay(); };
    if (isFullscreen) {
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    const container = collyDivRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [autoplay, stopAutoplay, isFullscreen]);

  useEffect(() => {
    if (!collyVisible && autoplay) stopAutoplay();
  }, [collyVisible, autoplay, stopAutoplay]);

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

  const toggleFullscreen = () => setIsFullscreen(f => !f);

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
      <div id="blacker" className={isFullscreen ? "show" : undefined} style={{ backgroundColor: bgColor }} />
      {isFullscreen && (
        <div className="spotclose show" onClick={toggleFullscreen}>
          <div className="noevents">x</div>
        </div>
      )}

      {/* Controls bar */}
      <div className="bg-secondary amb-1 p-0" style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "8px", rowGap: "16px", padding: "16px 8px 0" }}>
          {!isArchive && (
            <input type="button" className="btn-big" value={collyVisible ? "Hide Colly" : "View Colly"} onClick={toggleColly} />
          )}
          {!isArchive && collyVisible && (
            <input type="button" className="btn-big" id="fsbutton" value={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={toggleFullscreen} />
          )}
          {!isArchive && collyVisible && (
            <input type="button" className="btn-big" value={fitted ? "Reset size" : "Fit to screen"} onClick={fitColly} />
          )}
          <input type="button" className="btn-big" value="Download" onClick={doDownload} />

          {type === "ASCII" && collyVisible && (
            <input type="button" className="btn-big" value={copyImageLabel} onClick={doCopyImage} />
          )}

          {!isArchive && type === "ASCII" && collyVisible && (
            <>
              <input type="button" className="btn-big"
                value={autoplay ? "Stop" : "Autoplay"}
                onClick={() => autoplay ? stopAutoplay() : (startAutoplay())} />
              {autoplay && (
                <span className="lightgrey">{autoplayIndex + 1} / {sections.length}</span>
              )}
              {sections.length > 1 && (
                <input type="button" className="btn-big"
                  value={indexOpen ? "Close Index" : "Index"}
                  onClick={() => setIndexOpen(o => !o)} />
              )}
            </>
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
                <input type="button" className="btn-big" value="Edit" onClick={() => { window.location.href = `/admin#colly?getcollyname=${filename}`; }} />
              )}
            </>
          )}
        </div>

        {/* Color / font controls */}
        {!isArchive && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "8px", rowGap: "16px", padding: "16px 8px 16px" }}>
            <ColorSwatch current={bgColor} onChange={setBgColor} />
            <ColorSwatch current={fgColor} onChange={setFgColor} />
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
          {indexOpen && logoIndex.length > 0 && (
            <div style={{
              position: "sticky", top: 0, alignSelf: "flex-start",
              zIndex: 100, overflowY: "auto", maxHeight: "100vh",
              background: "rgba(17,17,17,0.93)", minWidth: "200px",
              borderRight: "1px solid #333", padding: "8px 0", flexShrink: 0,
            }}>
              {logoIndex.map((entry, n) => (
                <div
                  key={n}
                  onClick={() => { scrollToSection(entry.section); setIndexOpen(false); }}
                  style={{
                    padding: "4px 12px",
                    cursor: "pointer",
                    color: autoplay && autoplayIndex === n ? "#ff55ff" : "#aaaaaa",
                    background: autoplay && autoplayIndex === n ? "#222" : "transparent",
                    fontFamily: "monospace", fontSize: "13px", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}
                  title={entry.label}
                >
                  <span style={{ color: "#555", marginRight: "8px" }}>{n + 1}</span>
                  {entry.label}
                </div>
              ))}
            </div>
          )}
          <pre
            ref={collyRef as React.RefObject<HTMLPreElement>}
            id="colly"
            className={isFullscreen ? "fullscreen" : undefined}
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
            className={isFullscreen ? "fullscreen" : undefined}
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
              {c.rating != null && <><span className="yellow"> RATING:</span><span className="white"> {Number(c.rating).toFixed(1)}</span></>}
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
