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
import { buildAdminCollyEditHref } from "@/app/admin/collys/editHref";
import { FONTS, ANSI_FONT_MAP, loadAnsiLove, type AnsiLoveController } from "@/lib/ansilove";
import { looksLikeCp437Art, decodeReleaseText, isRenderableArt, isAnsiAnimation } from "@/lib/releaseText";

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
  extractedEntry: string | null;
  type: string;
  /** True when the release is PC/CP437 art — rendered via AnsiLove with an IBM
   *  font so block glyphs tile without the gaps the Amiga webfont leaves. */
  isCp437: boolean;
  collyTitle: string;
  siteUrl: string;
  initialViewCount: number;
  initialFavCount: number;
  initialDownloadCount: number;
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

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [170, 170, 170];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// CP437 art renders through AnsiLove's 1-bit IBM font: every pixel is either
// foreground (grey) or background (black). Repaint those two colours with the
// user's chosen fg/bg so the viewer keeps its colour customisation while the
// block glyphs stay pixel-perfect.
function recolorMonochromeCanvas(canvas: HTMLCanvasElement, fgHex: string, bgHex: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const [fr, fg, fb] = hexToRgb(fgHex);
  const [br, bg, bb] = hexToRgb(bgHex);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] || d[i + 1] || d[i + 2]) { d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; }
    else { d[i] = br; d[i + 1] = bg; d[i + 2] = bb; }
  }
  ctx.putImageData(img, 0, 0);
}

function ArchiveEntryRenderer({ filename, entry, ansiFont, fgColor, bgColor, isAdmin, initialAdminHidden }: { filename: string; entry: string; ansiFont: string; fgColor: string; bgColor: string; isAdmin: boolean; initialAdminHidden: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnsiLoveController | null>(null);
  const [hidden, setHidden] = useState(false);
  const [adminHidden, setAdminHidden] = useState(initialAdminHidden);
  const [busy, setBusy] = useState(false);
  const [isAnim, setIsAnim] = useState(false);
  const [playing, setPlaying] = useState(false);

  const ANIM_BAUD = 28800;
  const togglePlay = () => {
    const ctrl = animRef.current;
    if (!ctrl) return;
    if (playing) { ctrl.stop(); setPlaying(false); }
    else { ctrl.play(ANIM_BAUD, () => { if (animRef.current) animRef.current.play(ANIM_BAUD, () => {}, true); }, true); setPlaying(true); }
  };

  // Admins can hide unrelated entries (persisted); visitors then never receive
  // them. Hidden entries reach admins flagged, rendered dimmed with "Unhide".
  const toggleAdminHidden = async () => {
    const next = !adminHidden;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/collys/archive-hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, entry, hidden: next }),
      });
      if (res.ok) setAdminHidden(next);
    } catch { /* leave state unchanged on failure */ }
    setBusy(false);
  };

  // Pick the renderer by CONTENT, not file extension:
  //  - binary (image/module/exe)    -> hidden entirely (not art)
  //  - ANSI (has ESC[ codes)        -> AnsiLove, keep the file's own colours
  //  - CP437 block art (no escapes) -> AnsiLove (IBM font) recoloured to theme
  //  - plain ASCII / Latin-1 text   -> themed <pre>; AnsiLove would draw it as
  //    flat grey-on-black, so plain text is never sent through AnsiLove.
  // The archive API already normalises 8-bit CSI (0x9B) to ESC[.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    el.innerHTML = '<span style="animation:blink 2s linear infinite">.LOADiNG.</span>';

    const url = `/api/collys/archive?filename=${encodeURIComponent(filename)}&entry=${encodeURIComponent(entry)}`;
    const fail = () => { if (!cancelled) el.textContent = "Failed to render"; };

    fetch(url).then(r => r.arrayBuffer()).then(buf => {
      if (cancelled) return;
      const bytes = new Uint8Array(buf);
      // Not renderable art (binary blob) — drop the whole entry.
      if (!isRenderableArt(bytes)) { setHidden(true); return; }
      const hasEsc = bytes.includes(0x1b);
      const isCp437 = !hasEsc && looksLikeCp437Art(bytes);

      // Plain text — render as themed text, not an AnsiLove canvas.
      if (!hasEsc && !isCp437) {
        el.style.backgroundColor = bgColor;
        const pre = document.createElement("pre");
        pre.textContent = decodeReleaseText(bytes, "auto");
        pre.style.cssText = `font-family:${ansiFont},TopazPlus_a1200,monospace;font-size:16px;line-height:1;color:${fgColor};background:transparent;white-space:pre;margin:0;display:inline-block;text-align:left;overflow-x:auto`;
        el.innerHTML = "";
        el.appendChild(pre);
        return;
      }

      // ANSI animation — play it over time with animate() instead of drawing
      // the final (overlapping) frame statically.
      const animated = hasEsc && isAnsiAnimation(bytes);
      el.style.backgroundColor = isCp437 ? bgColor : "#000";
      loadAnsiLove().then(api => {
        if (cancelled) return;
        if (animated) {
          setIsAnim(true);
          const ctrl = api.animateBytes(bytes, (canvas: HTMLCanvasElement) => {
            if (cancelled) return;
            el.innerHTML = "";
            canvas.style.display = "block";
            canvas.style.margin = "0 auto";
            el.appendChild(canvas);
            const loop = () => { if (animRef.current && !cancelled) animRef.current.play(ANIM_BAUD, loop, true); };
            ctrl.play(ANIM_BAUD, loop, true);
            setPlaying(true);
          }, { font: ansiFont, bits: "8", icecolors: 1, filetype: "ans" });
          animRef.current = ctrl;
          return;
        }
        const opts = isCp437
          ? { font: "80x25", bits: "8", icecolors: 1, thumbnail: 0, filetype: "ascii" }
          : { font: ansiFont, bits: "8", icecolors: 1, thumbnail: 0, filetype: "ans" };
        api.renderBytes(bytes, (canvas: HTMLCanvasElement) => {
          if (cancelled) return;
          if (isCp437) recolorMonochromeCanvas(canvas, fgColor, bgColor);
          canvas.style.display = "block";
          canvas.style.margin = "0 auto";
          canvas.style.verticalAlign = "bottom";
          el.innerHTML = "";
          el.appendChild(canvas);
        }, opts, fail);
      }).catch(fail);
    }).catch(fail);

    return () => { cancelled = true; if (animRef.current) animRef.current.stop(); };
  }, [filename, entry, ansiFont, fgColor, bgColor]);

  if (hidden) return null;
  return (
    <div style={{ marginBottom: "16px", overflow: "visible", opacity: adminHidden ? 0.4 : 1 }}>
      <div className="header bg-header col-12 ap-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <span className="text-truncate">{entry.split("/").pop()}{adminHidden ? " (hidden)" : ""}</span>
        {isAnim && (
          <input
            type="button"
            className="btn-big"
            value={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            style={{ flexShrink: 0 }}
          />
        )}
        {isAdmin && (
          <input
            type="button"
            className="btn-big"
            value={adminHidden ? "Unhide" : "Hide"}
            onClick={toggleAdminHidden}
            disabled={busy}
            style={{ flexShrink: 0 }}
          />
        )}
      </div>
      <div ref={hostRef} style={{ backgroundColor: "#000", overflow: "visible", textAlign: "center", padding: "16px 0" }} />
    </div>
  );
}

export default function ReleaseClient({
  collyId, filename, collyFileUrl, userNick, isAdmin,
  isFavourited, initBgColor, initFgColor, initFont,
  isArchive, fileContent, extractedEntry, type, isCp437, collyTitle, siteUrl,
  initialViewCount, initialFavCount, initialDownloadCount,
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
  const [favCount, setFavCount] = useState(initialFavCount);
  const [downloadCount, setDownloadCount] = useState(initialDownloadCount);
  const [archiveFiles, setArchiveFiles] = useState<string[]>([]);
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(new Set());
  const [copyImageLabel, setCopyImageLabel] = useState("Copy as image");
  const [, startTransition] = useTransition();

  // Show the main ASCII viewer when either:
  // - it's not an archive, or
  // - it IS an archive but we extracted renderable content from it
  const hasInlineContent = !isArchive || !!fileContent;

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

  interface Draft { nick: string; text: string }
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [watching, setWatching] = useState(0);
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const channel = `comments:${collyId}`;

  useEffect(() => {
    const es = new EventSource(`/api/live?channel=${channel}`);
    es.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as { type: string; nick?: string; draft?: string; count?: number };
      if (event.type === "watching") {
        setWatching(event.count ?? 0);
      } else if (event.type === "typing" && event.nick) {
        const nick = event.nick;
        setDrafts(prev => ({ ...prev, [nick]: { nick, text: event.draft ?? "" } }));
        clearTimeout(draftTimers.current[nick]);
        draftTimers.current[nick] = setTimeout(() => {
          setDrafts(prev => { const next = { ...prev }; delete next[nick]; return next; });
        }, 4000);
      } else if (event.type === "clear" && event.nick) {
        const nick = event.nick;
        clearTimeout(draftTimers.current[nick]);
        setDrafts(prev => { const next = { ...prev }; delete next[nick]; return next; });
      } else if (event.type === "posted") {
        loadComments();
      } else if (event.type === "edited") {
        const ev = event as { commentId?: number; comment?: string };
        if (ev.commentId != null) {
          setComments(prev => prev.map(c => c.id === ev.commentId ? { ...c, comment: ev.comment ?? c.comment } : c));
        }
      } else if (event.type === "deleted") {
        const ev = event as { commentId?: number };
        if (ev.commentId != null) {
          setComments(prev => prev.filter(c => c.id !== ev.commentId));
        }
      }
    };
    return () => es.close();
  }, [channel, loadComments]);

  // Per-release favourite + download channels
  useEffect(() => {
    const esFav = new EventSource(`/api/live?channel=release:${collyId}:fav`);
    esFav.onmessage = (e: MessageEvent<string>) => {
      try {
        const ev = JSON.parse(e.data) as { type?: string; delta?: number; nick?: string };
        // Skip events caused by this user — they've already been applied optimistically.
        if (ev.nick && userNick && ev.nick === userNick) return;
        if (ev.type === "changed" && typeof ev.delta === "number") {
          setFavCount(c => Math.max(0, c + ev.delta!));
        }
      } catch {}
    };
    const esDl = new EventSource(`/api/live?channel=release:${collyId}:downloads`);
    esDl.onmessage = (e: MessageEvent<string>) => {
      try {
        const ev = JSON.parse(e.data) as { type?: string };
        if (ev.type === "downloaded") setDownloadCount(c => c + 1);
      } catch {}
    };
    return () => { esFav.close(); esDl.close(); };
  }, [collyId, userNick]);

  const broadcastTyping = useCallback((text: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type: text ? "typing" : "clear", draft: text }),
      }).catch(() => {});
    }, 50);
  }, [channel]);

  // Subscribe to live view-count updates from other viewers. trackView
  // broadcasts the new absolute total each time someone opens this page;
  // we use the broadcast value (not local +1) so all viewers stay in sync.
  useEffect(() => {
    const es = new EventSource(`/api/live?channel=release:${collyId}:views`);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as { type?: string; total?: number };
        if (evt.type === "viewed" && typeof evt.total === "number") {
          setViewCount(evt.total);
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
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

  // Broadcast view activity for logged-in users
  useEffect(() => {
    if (!userNick || !collyVisible) return;
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "view", target: filename, targetUrl: `/release/${filename}` }),
    }).catch(() => {});
  // fire only when visibility transitions to true, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collyVisible]);

  // PC/CP437 text collys render through AnsiLove (canvas) instead of the Amiga
  // text <pre>, so block glyphs tile without gaps. Amiga ASCII stays on <pre>.
  const isCp437Art = type === "ASCII" && isCp437;

  // Canvas (AnsiLove) renderer — used for ANSI art and for PC/CP437 block art.
  // ANSI carries its own colours; CP437 is monochrome IBM-font art that we
  // recolour to the user's fg/bg, so this effect also re-fires on colour change.
  useEffect(() => {
    if (!(type === "ANSI" || isCp437Art) || !collyVisible) return;
    let cancelled = false;

    const collyElOrNull = collyRef.current as HTMLElement | null;
    if (!collyElOrNull) return;
    const collyEl: HTMLElement = collyElOrNull;
    collyEl.innerHTML = "";
    const loadingEl = document.getElementById("loading") as HTMLElement | null;
    if (loadingEl) loadingEl.style.display = "";

    // CP437 art uses AnsiLove's IBM VGA font (80x25); ANSI art uses the
    // user-selected Amiga font. Don't force columns for CP437 — let the parser
    // keep the file's own width instead of wrapping wide art.
    const opts = isCp437Art
      ? { font: "80x25", bits: "8", icecolors: 1, thumbnail: 0, filetype: "ascii" }
      : { font: ANSI_FONT_MAP[font] ?? "mosoul", bits: "8", icecolors: 1, columns: 80, thumbnail: 0, filetype: "ans" };

    loadAnsiLove().then(api => {
      if (cancelled) return;
      api.splitRender(collyFileUrl, (canvases: HTMLCanvasElement[]) => {
        if (cancelled) return;
        canvases.forEach(canvas => {
          if (isCp437Art) recolorMonochromeCanvas(canvas, fgColor, bgColor);
          canvas.style.verticalAlign = "bottom";
          canvas.style.margin = "0 auto";
          canvas.style.display = "block";
          collyEl.appendChild(canvas);
        });
        if (loadingEl) loadingEl.style.display = "none";
      }, 100, opts);
    }).catch((err: unknown) => {
      if (loadingEl) {
        loadingEl.textContent = "Failed to load ANSI renderer.";
        loadingEl.style.color = "#ff5555";
      }
      console.error("AnsiLove render failed:", err);
    });

    return () => { cancelled = true; };
  }, [type, isCp437Art, collyVisible, font, collyFileUrl, fgColor, bgColor]);

  // List archive files when viewing an archive colly
  useEffect(() => {
    if (!isArchive || !collyVisible) return;
    fetch(`/api/collys/archive?filename=${encodeURIComponent(filename)}`)
      .then(r => r.json())
      .then(d => {
        const files: string[] = d.files ?? [];
        // Don't show the entry that was already extracted for inline display
        setArchiveFiles(extractedEntry ? files.filter(f => f !== extractedEntry) : files);
        // Admins get the hidden list back so hidden entries render dimmed with
        // an "Unhide" control; visitors never receive hidden entries at all.
        setHiddenEntries(new Set<string>(d.hidden ?? []));
      })
      .catch(() => { setArchiveFiles([]); setHiddenEntries(new Set<string>()); });
  }, [isArchive, collyVisible, filename, extractedEntry]);

  // Auto-fit on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && hasInlineContent) fitColly();
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
      // Don't fire shortcuts when typing in form fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
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
      setFavCount(c => c + 1);
      const r = await addFavourite(collyId);
      if (!r.success) { setFav(false); setFavCount(c => Math.max(0, c - 1)); }
    } else {
      setFav(false); // optimistic
      setFavCount(c => Math.max(0, c - 1));
      const r = await removeFavourite(collyId);
      if (!r.success) { setFav(true); setFavCount(c => c + 1); }
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
      loadComments();
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type: "clear" }),
      }).catch(() => {});
      if (userNick) {
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "comment", target: filename, targetUrl: `/release/${filename}` }),
        }).catch(() => {});
      }
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
    fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, type: "clear" }),
    }).catch(() => {});
  };

  // Both ANSI and CP437 art render on the AnsiLove <canvas> path.
  const useCanvasViewer = type === "ANSI" || isCp437Art;

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
          {hasInlineContent && (
            <input type="button" className="btn-big" value={collyVisible ? "Hide Colly" : "View Colly"} onClick={toggleColly} />
          )}
          {hasInlineContent && collyVisible && (
            <input type="button" className="btn-big" id="fsbutton" value={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={toggleFullscreen} />
          )}
          {hasInlineContent && collyVisible && (
            <input type="button" className="btn-big" value={fitted ? "Reset size" : "Fit to screen"} onClick={fitColly} />
          )}
          <input type="button" className="btn-big" value="Download" onClick={doDownload} />

          {type === "ASCII" && collyVisible && (
            <input type="button" className="btn-big" value={copyImageLabel} onClick={doCopyImage} />
          )}

          {hasInlineContent && type === "ASCII" && !isCp437Art && collyVisible && (
            <>
              <input type="button" className="btn-big"
                value={autoplay ? "Stop" : "Autoplay"}
                onClick={() => autoplay ? stopAutoplay() : (startAutoplay())} />
              {autoplay && (
                <span className="lightgrey">{autoplayIndex + 1} / {sections.length}</span>
              )}
              {sections.length > 2 && (
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

          {viewCount > 0 && (
            <span className="lightgrey">{viewCount} {viewCount === 1 ? "view" : "views"}</span>
          )}
          {watching > 1 && (
            <span className="lightgrey">{watching} watching</span>
          )}
          {commentsLoaded && comments.length > 0 && (
            <span className="lightgrey">{comments.length} {comments.length === 1 ? "comment" : "comments"}</span>
          )}
          {favCount > 0 && (
            <span className="lightgrey">{favCount} {favCount === 1 ? "favourite" : "favourites"}</span>
          )}
          {downloadCount > 0 && (
            <span className="lightgrey">{downloadCount} {downloadCount === 1 ? "download" : "downloads"}</span>
          )}

          {commentsLoaded && comments.length > 0 && (
            <a href="#comments" className="btn-big bg-header apt-1 apb-1 grey-text" role="button">View Comments ({comments.length})</a>
          )}

          {userNick && (
            <>
              <input type="button" className="btn-big" value={fav ? "Remove favourite" : "Favourite"} onClick={toggleFav} />
              <input type="button" className="btn-big" value="Report Broken" onClick={() => { setSection("broken"); setCollyVisible(false); }} />
              {isAdmin && (
                <input type="button" className="btn-big" value="Edit" onClick={() => { window.location.href = buildAdminCollyEditHref(filename); }} />
              )}
            </>
          )}
        </div>

        {/* Color / font controls */}
        {hasInlineContent && (
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

      {/* ASCII text viewer — Amiga ASCII collys + archive-extracted content.
          PC/CP437 art skips this and renders on the canvas viewer below. */}
      {!useCanvasViewer && (type === "ASCII" || !!fileContent) && collyVisible && (
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
            style={{ overflow: "hidden", fontFamily: `${font}, TopazPlus_a1200, "Courier New", Consolas, monospace`, fontSize: "16px", lineHeight: "1", color: fgColor, whiteSpace: "pre", fontFeatureSettings: "normal", fontKerning: "none", textRendering: "optimizeSpeed" }}
            dangerouslySetInnerHTML={{ __html: "<br><br><br><br>" + fileContent + "<br><br><br><br>" }}
          />
        </div>
      )}

      {/* Canvas viewer — AnsiLove renders ANSI art and PC/CP437 block art here.
          CP437 art is recoloured to the user's bg, so match the container bg. */}
      {useCanvasViewer && collyVisible && (
        <div
          ref={collyDivRef}
          id="colly-div"
          style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundColor: isCp437Art ? bgColor : "#000", overflowX: "hidden", margin: 0, padding: 0 }}
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

      {/* Archive hero — the largest renderable entry, shown prominently
          (it is filtered out of the browser list below). */}
      {isArchive && extractedEntry && (
        <ArchiveEntryRenderer
          filename={filename}
          entry={extractedEntry}
          ansiFont={ANSI_FONT_MAP[font] ?? "mosoul"}
          fgColor={fgColor}
          bgColor={bgColor}
          isAdmin={isAdmin}
          initialAdminHidden={hiddenEntries.has(extractedEntry)}
        />
      )}

      {/* Archive viewer — renders each file in the archive using AnsiLove */}
      {isArchive && archiveFiles.length > 0 && (
        <div>
          <div className="bg-secondary amb-1 ap-1" style={{ textAlign: "center" }}>
            <input type="button" className="btn-big" value={`Download ${filename}`} onClick={doDownload} style={{ fontSize: "16px", padding: "12px 24px" }} />
          </div>
          {archiveFiles.map(entry => (
            <ArchiveEntryRenderer
              key={entry}
              filename={filename}
              entry={entry}
              ansiFont={ANSI_FONT_MAP[font] ?? "mosoul"}
              fgColor={fgColor}
              bgColor={bgColor}
              isAdmin={isAdmin}
              initialAdminHidden={hiddenEntries.has(entry)}
            />
          ))}
        </div>
      )}
      {isArchive && archiveFiles.length === 0 && (
        <div className="bg-secondary amb-1 ap-2" style={{ textAlign: "center" }}>
          <div className="lightgrey amb-1">This archive contains no displayable files.</div>
          <input type="button" className="btn-big" value={`Download ${filename}`} onClick={doDownload} style={{ fontSize: "16px", padding: "12px 24px" }} />
        </div>
      )}

      {/* Comments list */}
      <div id="comments">
        {/* Add comment form — always visible for logged-in users.
            Rows render at full width to match the colly preview above;
            the previous apl-1/apr-1/aml-1/amr-1 padding-margin combo
            indented the form by 16-32px on each side. */}
        {userNick && (
          <div className="amb-1">
            <div className="header bg-header col-12 ap-1">ENTER YOUR COMMENT</div>
            <textarea
              style={{ height: "128px", width: "100%", display: "block" }}
              className="bg-secondary cyan ap-1"
              value={commentText}
              onChange={e => { setCommentText(e.target.value); broadcastTyping(e.target.value); }}
            />
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
        )}

        {commentsLoaded && comments.length > 0 && comments.map(c => (
          <div key={c.id}>
            <div className="header bg-header col-12 ap-1 text-truncate">
              <span> BY: </span><span className="yellow">{c.nick}</span>
              <span> DATE: </span><span className="white">{c.time}</span>
              {c.rating != null && <><span className="yellow"> RATING:</span><span className="white"> {Number(c.rating).toFixed(1)}</span></>}
            </div>
            <div className="bg-secondary col-12 ap-1 amb-1">
              <span className="cyan" style={{ whiteSpace: "pre-wrap" }}>
                {c.comment ?? `${c.nick} voted ${c.rating}`}
              </span>
              <div className="col-12 p-0 m-0 apt-1" style={{ display: "flex", gap: "8px" }}>
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

      {/* Live drafts — other users currently typing a comment */}
      {Object.values(drafts).filter(d => d.text && d.nick !== userNick).map(d => (
        <div key={d.nick}>
          <div className="header bg-header col-12 ap-1 text-truncate">
            <span> BY: </span><span className="yellow">{d.nick}</span>
            <span className="lightgrey"> (typing...)</span>
          </div>
          <div className="bg-secondary col-12 ap-1 amb-1">
            <span className="lightgrey" style={{ whiteSpace: "pre-wrap", opacity: 0.7 }}>
              {d.text}<span className="cursor-block" />
            </span>
          </div>
        </div>
      ))}

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
