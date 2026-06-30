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
import { animateScroll } from "@/lib/animateScroll";
import {
  detectLogoSections,
  buildLogoIndex,
  computeScrollTarget,
  pingPongNext,
  type LogoSection,
} from "@/lib/logoSections";
import LogoMinimap, { MINIMAP_WIDTH } from "./LogoMinimap";
import { parseCollyIndex, sectionForIndexEntry, linkifyCollyIndex } from "@/lib/collyIndex";
import { useMusic } from "@/components/music/MusicProvider";
import { BeatDetector, lowBandEnergy } from "@/lib/uade/beatDetector";

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
  /** Decoded plaintext for logo detection on canvas (ANSI) collys, where
   *  fileContent is empty because the art renders on the AnsiLove canvas. */
  logoText: string;
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

function ArchiveEntryRenderer({ filename, entry, entryIndex, eager, ansiFont, fgColor, bgColor, isAdmin, initialAdminHidden }: { filename: string; entry: string; entryIndex: number; eager?: boolean; ansiFont: string; fgColor: string; bgColor: string; isAdmin: boolean; initialAdminHidden: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnsiLoveController | null>(null);
  const [hidden, setHidden] = useState(false);
  const [adminHidden, setAdminHidden] = useState(initialAdminHidden);
  const [busy, setBusy] = useState(false);
  const [isAnim, setIsAnim] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rendered, setRendered] = useState(false);
  // Render/fetch on demand: only when the slot is near the viewport (or eager,
  // for the hero). Big packs (90+ entries) otherwise fetch + render everything
  // at once. The index below scrolls a slot into view, which triggers this.
  const [visible, setVisible] = useState(!!eager);

  useEffect(() => {
    if (visible) return;
    const node = wrapperRef.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); obs.disconnect(); }
    }, { rootMargin: "600px" });
    obs.observe(node);
    return () => obs.disconnect();
  }, [visible]);

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
    if (!visible) return;
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
      setRendered(true); // content is coming — release the placeholder height
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
  }, [visible, filename, entry, ansiFont, fgColor, bgColor]);

  if (hidden) return null;
  return (
    <div ref={wrapperRef} id={`archive-entry-${entryIndex}`} style={{ marginBottom: "16px", overflow: "visible", opacity: adminHidden ? 0.4 : 1, scrollMarginTop: "16px" }}>
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
      <div ref={hostRef} style={{ backgroundColor: "#000", overflow: "visible", textAlign: "center", padding: "16px 0", minHeight: rendered ? undefined : "160px" }} />
    </div>
  );
}

export default function ReleaseClient({
  collyId, filename, collyFileUrl, userNick, isAdmin,
  isFavourited, initBgColor, initFgColor, initFont,
  isArchive, fileContent, logoText, extractedEntry, type, isCp437, collyTitle, siteUrl,
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
  const autoplayDirRef = useRef(1); // +1 forward, -1 backward (ping-pong loop)
  // Groove mode: advance the slideshow on the music's beat instead of a timer.
  const [musicGroove, setMusicGroove] = useState(false);
  const { getAnalyser: getMusicAnalyser, playRandom: playRandomMusic, isPlaying: musicIsPlaying } = useMusic();
  const musicPlayingRef = useRef(false);
  useEffect(() => { musicPlayingRef.current = musicIsPlaying; }, [musicIsPlaying]);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayRafRef   = useRef<(() => void) | null>(null);
  const beatRafRef       = useRef<number | null>(null);
  const isAutoScrolling  = useRef(false);
  // SVG warp-filter primitives, animated for the flaky-VHS bend on big beats.
  const warpDispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const warpTurbRef = useRef<SVGFETurbulenceElement | null>(null);
  // Grace timer that keeps isAutoScrolling true briefly after an animation ends,
  // so trailing (async) programmatic scroll events aren't read as user scrolls.
  const autoScrollClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Text the logo detector runs on: the HTML <pre> content for ASCII, or the
  // decoded plaintext for canvas (ANSI) collys where fileContent is empty.
  const detectionText = logoText || fileContent;
  const sections  = useMemo(() => detectLogoSections(detectionText), [detectionText]);
  const logoIndex = useMemo(() => buildLogoIndex(detectionText, sections), [detectionText, sections]);
  // The index panel prefers the colly's OWN embedded index (clean author names)
  // when one exists, falling back to the auto-detected divider labels.
  const displayIndex = useMemo(() => {
    const parsed = parseCollyIndex(detectionText);
    if (parsed.length) {
      return parsed
        .map((e) => ({ label: e.name, section: sectionForIndexEntry(e, logoIndex, sections) }))
        .filter((x): x is { label: string; section: LogoSection } => x.section !== null);
    }
    return logoIndex.map((li) => ({ label: li.label, section: li.section }));
  }, [detectionText, logoIndex, sections]);
  // The colly HTML with its embedded "oN> NAME" index entries wrapped in
  // clickable spans (data-logo-line) — so the index in the art is clickable.
  const linkedContent = useMemo(
    () => linkifyCollyIndex(fileContent, (e) => sectionForIndexEntry(e, logoIndex, sections)?.startLine ?? null),
    [fileContent, logoIndex, sections],
  );
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

  // Broadcast view activity — for everyone; anonymous viewers show as "anon".
  useEffect(() => {
    if (!collyVisible) return;
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
    if (autoplayRafRef.current)   { autoplayRafRef.current(); autoplayRafRef.current = null; }
    if (beatRafRef.current != null) { cancelAnimationFrame(beatRafRef.current); beatRafRef.current = null; }
    if (autoScrollClearRef.current) { clearTimeout(autoScrollClearRef.current); autoScrollClearRef.current = null; }
    isAutoScrolling.current = false;
  }, []);

  const startAutoplay = useCallback(() => {
    if (collyDivRef.current) collyDivRef.current.scrollTop = 0;
    autoplayDirRef.current = 1;
    setIsFullscreen(true);
    setAutoplayIndex(0);
    setAutoplay(true);
    // Groove mode: make sure a tune is playing so beats can drive the slideshow.
    if (musicGroove && !musicPlayingRef.current) void playRandomMusic();
  }, [musicGroove, playRandomMusic]);

  // Advance to the next logo, ping-ponging at the ends so autoplay loops forever
  // (forward to the last logo, then backward to the first, and so on).
  const advanceAutoplay = useCallback(() => {
    setAutoplayIndex((i) => {
      const r = pingPongNext(i, autoplayDirRef.current, sections.length);
      autoplayDirRef.current = r.dir;
      return r.index;
    });
  }, [sections.length]);

  // Scroll/centre metrics that work for BOTH the text <pre> and the AnsiLove
  // canvas (ANSI/CP437). The canvas renders rows at a fixed height, so a logo's
  // line number maps to an exact pixel position — detect a canvas in the
  // container and use its per-row height; otherwise use the <pre>'s line height.
  const getScrollMetrics = useCallback(() => {
    const scrollEl = collyDivRef.current;
    if (!scrollEl) return null;
    const viewH = scrollEl.clientHeight;
    const maxScroll = scrollEl.scrollHeight - viewH;
    const elTop = scrollEl.getBoundingClientRect().top;
    const canvas = scrollEl.querySelector("canvas");
    if (canvas && canvas.clientHeight) {
      const total = Math.max(1, detectionText.split("\n").length);
      const lineHeight = canvas.clientHeight / total;
      const originTop = canvas.getBoundingClientRect().top - elTop + scrollEl.scrollTop;
      return { scrollEl, viewH, maxScroll, lineHeight, spacers: 0, originTop };
    }
    const pre = collyRef.current as HTMLElement | null;
    if (!pre) return null;
    const lineHeight = parseFloat(getComputedStyle(pre).lineHeight) || 16;
    const originTop = pre.getBoundingClientRect().top - elTop + scrollEl.scrollTop;
    return { scrollEl, viewH, maxScroll, lineHeight, spacers: 4, originTop };
  }, [detectionText]);

  const scrollToSection = useCallback((section: LogoSection) => {
    const m = getScrollMetrics();
    if (!m) return;
    const target = computeScrollTarget(section, { spacers: m.spacers, lineHeight: m.lineHeight, viewH: m.viewH, originTop: m.originTop, maxScroll: m.maxScroll });
    animateScroll(m.scrollEl, target, 500);
  }, [getScrollMetrics]);

  // Click on an embedded index entry (linkifyCollyIndex wrapped it) -> scroll to
  // that logo.
  const onCollyClick = useCallback((e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest("[data-logo-line]");
    if (!el) return;
    const line = parseInt(el.getAttribute("data-logo-line") ?? "", 10);
    if (Number.isNaN(line) || !sections.length) return;
    let best = sections[0];
    for (const s of sections) if (Math.abs(s.startLine - line) < Math.abs(best.startLine - line)) best = s;
    scrollToSection(best);
  }, [sections, scrollToSection]);

  // Deep-link: /release/<file>#logo-<startLine> scrolls to that logo on load
  // (used by colly-logo search + crew/artist/user "logos in collys" links).
  const deepLinkedRef = useRef(false);
  useEffect(() => {
    if (deepLinkedRef.current || !collyVisible) return;
    const m = /(?:^|#)logo-(\d+)/.exec(window.location.hash);
    if (!m) return;
    const line = parseInt(m[1], 10);
    let cancelled = false;
    let tries = 0;
    // Poll until the colly is actually laid out and scrollable — a fixed delay
    // was firing before layout on large/slow collys, so it scrolled to ~0.
    const attempt = () => {
      if (cancelled || deepLinkedRef.current) return;
      const container = collyDivRef.current;
      const ready = container && container.scrollHeight > container.clientHeight + 10;
      if (ready) {
        deepLinkedRef.current = true;
        const pre = collyRef.current as HTMLElement | null;
        if (pre && sections.length) {
          // Precise (text colly): scroll to the nearest detected section.
          let best = sections[0];
          for (const s of sections) {
            if (Math.abs(s.startLine - line) < Math.abs(best.startLine - line)) best = s;
          }
          scrollToSection(best);
        } else {
          // Canvas colly (ANSI/CP437): no text <pre> to measure, so scroll
          // proportionally by line position.
          const totalLines = Math.max(1, fileContent.split("\n").length);
          const max = container.scrollHeight - container.clientHeight;
          animateScroll(container, Math.max(0, Math.min((line / totalLines) * max, max)), 500);
        }
        return;
      }
      if (tries++ < 50) setTimeout(attempt, 100); // up to ~5s
    };
    attempt();
    return () => { cancelled = true; };
  }, [collyVisible, sections, scrollToSection, fileContent]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!collyVisible || !(type === "ASCII" || type === "ANSI")) return; // text + canvas viewers
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

  // Step-and-centre autoplay (groove OFF). Groove mode centres each logo too,
  // but bounces it to the beat — handled by the effect below.
  useEffect(() => {
    if (!autoplay || !collyVisible) return;
    if (musicGroove) return;
    if (!sections.length) { stopAutoplay(); return; }

    const logoSection = sections[Math.min(autoplayIndex, sections.length - 1)];
    const m = getScrollMetrics();
    if (!m) return;
    const { scrollEl, viewH, maxScroll } = m;
    const target   = computeScrollTarget(logoSection, { spacers: m.spacers, lineHeight: m.lineHeight, viewH, originTop: m.originTop, maxScroll });
    const hold     = Math.min(4000 + Math.max(0, logoSection.lineCount - 20) * 15, 8000);
    const scrollMs = 700;

    if (autoplayRafRef.current)   { autoplayRafRef.current(); autoplayRafRef.current = null; }
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);

    isAutoScrolling.current = true;
    if (autoScrollClearRef.current) { clearTimeout(autoScrollClearRef.current); autoScrollClearRef.current = null; }
    autoplayRafRef.current = animateScroll(scrollEl, target, scrollMs, () => {
      autoplayRafRef.current = null;
      autoScrollClearRef.current = setTimeout(() => {
        isAutoScrolling.current = false;
        autoScrollClearRef.current = null;
      }, 200);
    });

    autoplayTimerRef.current = setTimeout(() => {
      autoplayTimerRef.current = null;
      advanceAutoplay();
    }, scrollMs + hold);

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (autoplayRafRef.current)   { autoplayRafRef.current(); autoplayRafRef.current = null; }
      if (autoScrollClearRef.current) { clearTimeout(autoScrollClearRef.current); autoScrollClearRef.current = null; }
      isAutoScrolling.current = false;
    };
  }, [autoplay, autoplayIndex, collyVisible, sections, stopAutoplay, isFullscreen, musicGroove, advanceAutoplay, getScrollMetrics]);

  // Groove autoplay: centre each logo (scroll-to-logo, like normal autoplay),
  // but ride the music while it's held — the view eases in to the logo, bounces
  // on every kick (so you see the groove in the motion), the logo glows on
  // transients, and it advances to the next logo on a beat after a short dwell.
  useEffect(() => {
    if (!autoplay || !musicGroove || !collyVisible || !musicIsPlaying) return;
    if (!sections.length) { stopAutoplay(); return; }
    const analyser = getMusicAnalyser();
    const pre = collyRef.current as HTMLElement | null;
    if (!analyser || !pre) return;

    // #colly-div is the scroller AND the filter stage (viewport-sized, so the
    // warp/glow filters actually render). Metrics handle both <pre> and canvas.
    const m = getScrollMetrics();
    if (!m) return;
    const { scrollEl, viewH, maxScroll } = m;
    const stage = scrollEl;
    const target = computeScrollTarget(sections[Math.min(autoplayIndex, sections.length - 1)], { spacers: m.spacers, lineHeight: m.lineHeight, viewH, originTop: m.originTop, maxScroll });

    const prevBehavior = scrollEl.style.scrollBehavior;
    scrollEl.style.scrollBehavior = "auto"; // per-frame writes must be instant
    const freq = new Uint8Array(analyser.frequencyBinCount);
    const prevFreq = new Uint8Array(analyser.frequencyBinCount);
    // Per-band spectral-flux onset detection so different instruments drive
    // different effects (bass != snare != hats). Flux = sum of positive
    // frame-to-frame bin increases in the band.
    const bandFlux = (lo: number, hi: number) => {
      let f = 0;
      for (let i = lo; i < hi; i++) { const d = freq[i] - prevFreq[i]; if (d > 0) f += d; }
      return f / ((hi - lo) * 255);
    };
    const kickDet = new BeatDetector({ sensitivity: 2.2, refractoryMs: 200, floor: 0.006, windowSize: 43 }); // bass/kick (drives the scroll)
    const midDet  = new BeatDetector({ sensitivity: 3.6, refractoryMs: 360, floor: 0.008, windowSize: 43 }); // snare/mid (occasional)
    const highDet = new BeatDetector({ sensitivity: 4.2, refractoryMs: 320, floor: 0.006, windowSize: 43 }); // hats/treble (occasional)
    const startT = performance.now();
    const minDwell = 2200;
    const maxDwell = 7000;
    let baseline = 0, glow = 0, surge = 0, glitch = 0, warp = 0, lastWarp = 0, sparkle = 0;
    let base = scrollEl.scrollTop; // eases toward the logo's centred position
    isAutoScrolling.current = true;
    // Foreground colour to pulse toward white on the glow (bg is left untouched).
    const fgM = /^#?([0-9a-f]{6})$/i.exec(fgColor.trim());
    const fgN = fgM ? parseInt(fgM[1], 16) : 0xff55ff;
    const fr = (fgN >> 16) & 255, fgc = (fgN >> 8) & 255, fb = fgN & 255;

    const tick = (now: number) => {
      const dt = now - startT;
      base += (target - base) * 0.16; // ease in to the centred logo
      analyser.getByteFrequencyData(freq);
      // Per-band onset strength (compute before updating prevFreq).
      const kf = bandFlux(1, 6);    // bass / kick
      const mf = bandFlux(8, 40);   // snare / mids
      const hf = bandFlux(60, 180); // hats / treble
      for (let i = 1; i < 180; i++) prevFreq[i] = freq[i];

      const eGlow = lowBandEnergy(freq, 24);
      baseline = baseline === 0 ? eGlow : baseline * 0.95 + eGlow * 0.05;

      const kick = kickDet.detect(kf, now);
      const mid  = midDet.detect(mf, now);
      const high = highDet.detect(hf, now);

      // Bass/kick -> scroll bounce, the flaky-VHS warp (gated, rare), and the
      // logo advance. Snare/mid -> RGB chromatic split + horizontal jitter.
      // Hats/treble -> brightness sparkle + vertical shimmer.
      if (kick) surge += 22;                                  // scroll bounce (kept punchy)
      if (kick && kf > 0.07 && now - lastWarp > 900) { warp = 1; lastWarp = now; } // warp more often
      if (mid) glitch = 1;
      if (high) sparkle = 1;
      surge *= 0.82;
      glitch *= 0.8;
      warp *= 0.9;        // warp lingers longer (~0.7s) so the bend reads
      sparkle *= 0.75;

      // glow: very gentle loudness breathing + a tiny treble sparkle (kept
      // subtle — the bright flashes were annoying)
      glow = glow * 0.6 + Math.min(Math.max(0, eGlow - baseline) * 1.1 + sparkle * 0.1, 0.16) * 0.4;

      const useWarp = warp > 0.02;
      // Only the warp (a displacement, no colour change) touches the stage, so
      // the background never pulses. The glow pulses the FOREGROUND colour
      // instead (below); the glitch punch lives in the RGB split + jitter.
      stage.style.filter = useWarp ? "url(#vhsWarp)" : "";
      const t = Math.min(glow * 2.6, 0.45);
      pre.style.color = `rgb(${Math.round(fr + (255 - fr) * t)},${Math.round(fgc + (255 - fgc) * t)},${Math.round(fb + (255 - fb) * t)})`;
      if (useWarp) {
        warpDispRef.current?.setAttribute("scale", (warp * 35).toFixed(1)); // half-strength bend
        warpTurbRef.current?.setAttribute("seed", String(Math.floor(now / 60) % 200));
      } else {
        warpDispRef.current?.setAttribute("scale", "0");
      }

      // RGB split (mid) on the pre + a subtle combined jitter on the stage. Both
      // toned down so they punctuate rather than run constantly.
      if (glitch > 0.05) {
        const split = (1 + glitch * 4).toFixed(1);
        pre.style.textShadow = `${split}px 0 rgba(255,0,90,0.5), -${split}px 0 rgba(0,210,255,0.5)`;
      } else if (pre.style.textShadow) {
        pre.style.textShadow = "";
      }
      if (glitch > 0.05 || sparkle > 0.05) {
        const jx = ((Math.random() - 0.5) * glitch * 7).toFixed(1);
        const jy = ((Math.random() - 0.5) * sparkle * 4).toFixed(1);
        const sk = (glitch > 0.5 ? (Math.random() - 0.5) * glitch * 1.2 : 0).toFixed(2);
        stage.style.transform = `translate(${jx}px, ${jy}px) skewX(${sk}deg)`;
      } else if (stage.style.transform) {
        stage.style.transform = "";
      }

      scrollEl.scrollTop = Math.max(0, Math.min(base + surge, maxScroll));
      if ((kick && dt >= minDwell) || dt >= maxDwell) {
        beatRafRef.current = null;
        advanceAutoplay();
        return;
      }
      beatRafRef.current = requestAnimationFrame(tick);
    };
    beatRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (beatRafRef.current != null) { cancelAnimationFrame(beatRafRef.current); beatRafRef.current = null; }
      scrollEl.style.scrollBehavior = prevBehavior;
      stage.style.filter = "";
      stage.style.transform = "";
      if (collyRef.current) { const e = collyRef.current as HTMLElement; e.style.textShadow = ""; e.style.color = fgColor; }
      warpDispRef.current?.setAttribute("scale", "0");
      isAutoScrolling.current = false;
    };
  }, [autoplay, musicGroove, musicIsPlaying, autoplayIndex, collyVisible, sections, stopAutoplay, isFullscreen, getMusicAnalyser, advanceAutoplay, fgColor, getScrollMetrics]);

  // Stop autoplay if the user scrolls the colly themselves. #colly-div is the
  // scroller in both modes now.
  useEffect(() => {
    if (!autoplay) return;
    const container = collyDivRef.current;
    if (!container) return;
    const onScroll = () => { if (!isAutoScrolling.current) stopAutoplay(); };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [autoplay, stopAutoplay, isFullscreen]);

  useEffect(() => {
    if (!collyVisible && autoplay) stopAutoplay();
  }, [collyVisible, autoplay, stopAutoplay]);

  // Autoplay runs in fullscreen; leaving fullscreen (button or `f` key) ends it.
  useEffect(() => {
    if (autoplay && !isFullscreen) stopAutoplay();
  }, [autoplay, isFullscreen, stopAutoplay]);

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

  // Jump-to-logo index panel — shared by the text and canvas viewers.
  const indexPanel = indexOpen && displayIndex.length > 0 ? (
    <div style={{
      position: "sticky", top: 0, alignSelf: "flex-start",
      zIndex: 100, overflowY: "auto", maxHeight: "100vh",
      background: "rgba(17,17,17,0.93)", minWidth: "200px",
      borderRight: "1px solid #333", padding: "8px 0", flexShrink: 0,
    }}>
      {displayIndex.map((entry, n) => {
        const current = autoplay && sections[autoplayIndex] === entry.section;
        return (
          <div
            key={n}
            onClick={() => { scrollToSection(entry.section); setIndexOpen(false); }}
            style={{
              padding: "4px 12px", cursor: "pointer",
              color: current ? "#ff55ff" : "#aaaaaa",
              background: current ? "#222" : "transparent",
              fontFamily: "monospace", fontSize: "13px", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}
            title={entry.label}
          >
            <span style={{ color: "#555", marginRight: "8px" }}>{n + 1}</span>
            {entry.label}
          </div>
        );
      })}
    </div>
  ) : null;

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

          {hasInlineContent && (type === "ASCII" || useCanvasViewer) && collyVisible && (
            <>
              <input type="button" className="btn-big"
                value={autoplay ? "Stop" : "Autoplay"}
                onClick={() => autoplay ? stopAutoplay() : (startAutoplay())} />
              <input type="button" className="btn-big"
                value={musicGroove ? "Groove: ON" : "Groove: OFF"}
                title="Advance logos to the beat of the music (starts a random Modland tune if nothing is playing)"
                style={musicGroove ? { color: "#ff55ff", borderColor: "#ff55ff" } : undefined}
                onClick={() => setMusicGroove(g => !g)} />
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
      {/* Hidden SVG warp filter for the flaky-VHS bend (driven in groove autoplay). */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="vhsWarp" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence ref={warpTurbRef} type="fractalNoise" baseFrequency="0 0.005" numOctaves={1} seed={1} result="n" />
          <feDisplacementMap ref={warpDispRef} in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {!useCanvasViewer && (type === "ASCII" || !!fileContent) && collyVisible && (
        <div style={{ position: "relative" }}>
        <div
          ref={collyDivRef}
          id="colly-div"
          style={{
            display: "flex", justifyContent: "center", alignItems: "flex-start",
            overflowY: "scroll", overflowX: "hidden", height: "100vh",
            backgroundColor: bgColor, margin: 0, padding: 0,
            paddingRight: !isFullscreen && type === "ASCII" && logoIndex.length > 1 ? `${MINIMAP_WIDTH}px` : 0,
            // Fullscreen: become the fixed, viewport-sized stage so CSS/SVG
            // filters (the groove warp/glow) render — they're dropped on the
            // full-height <pre>.
            ...(isFullscreen ? { position: "fixed" as const, top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 999998 } : {}),
          }}
        >
          {indexPanel}
          <pre
            ref={collyRef as React.RefObject<HTMLPreElement>}
            id="colly"
            className={isFullscreen ? "fullscreen" : undefined}
            style={{ overflow: "hidden", fontFamily: `${font}, TopazPlus_a1200, "Courier New", Consolas, monospace`, fontSize: "16px", lineHeight: "1", color: fgColor, whiteSpace: "pre", fontFeatureSettings: "normal", fontKerning: "none", textRendering: "optimizeSpeed" }}
            onClick={onCollyClick}
            dangerouslySetInnerHTML={{ __html: "<br><br><br><br>" + linkedContent + "<br><br><br><br>" }}
          />
        </div>
        {!isFullscreen && type === "ASCII" && (
          <LogoMinimap
            containerRef={collyDivRef}
            preRef={collyRef}
            entries={logoIndex}
            spacers={4}
            fgColor={fgColor}
          />
        )}
        </div>
      )}

      {/* Canvas viewer — AnsiLove renders ANSI art and PC/CP437 block art here.
          CP437 art is recoloured to the user's bg, so match the container bg. */}
      {useCanvasViewer && collyVisible && (
        <div
          ref={collyDivRef}
          id="colly-div"
          style={{
            display: "flex", justifyContent: "center", alignItems: "flex-start",
            overflowY: "scroll", overflowX: "hidden", height: "100vh",
            backgroundColor: isCp437Art ? bgColor : "#000", margin: 0, padding: 0,
            // Fullscreen: fixed viewport-sized stage so the groove warp/filters render.
            ...(isFullscreen ? { position: "fixed" as const, top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 999998 } : {}),
          }}
        >
          {indexPanel}
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
          entryIndex={-1}
          eager
          ansiFont={ANSI_FONT_MAP[font] ?? "mosoul"}
          fgColor={fgColor}
          bgColor={bgColor}
          isAdmin={isAdmin}
          initialAdminHidden={hiddenEntries.has(extractedEntry)}
        />
      )}

      {/* Archive viewer — renders each file on demand (as it scrolls into view).
          The index jumps to any entry, which scrolls it in and renders it. */}
      {isArchive && archiveFiles.length > 0 && (
        <div>
          <div className="bg-secondary amb-1 ap-1" style={{ textAlign: "center" }}>
            <input type="button" className="btn-big" value={`Download ${filename}`} onClick={doDownload} style={{ fontSize: "16px", padding: "12px 24px" }} />
          </div>

          {/* Clickable index of all entries — jump to (and render) any one.
              Magenta hover links like the sidebar widgets, 3 compact columns. */}
          <div className="bg-secondary amb-1 ap-1" style={{ columns: "150px 4", columnGap: "16px" }}>
            {archiveFiles.map((entry, i) => (
              <button
                key={entry}
                type="button"
                className={`text-truncate ${hiddenEntries.has(entry) ? "lightgrey" : "magenta"}`}
                title={entry}
                onClick={() => document.getElementById(`archive-entry-${i}`)?.scrollIntoView({ block: "start" })}
                style={{
                  display: "block", width: "100%", breakInside: "avoid",
                  background: "transparent", border: "none", cursor: "pointer",
                  // Match the sidebar widgets: 16px line, override the global 48px
                  // button min-height, 8px left padding.
                  minHeight: 0, height: "auto",
                  margin: 0, padding: "0 0 0 8px", lineHeight: "16px", textAlign: "left",
                  fontFamily: "inherit", fontSize: "inherit",
                }}
              >
                {hiddenEntries.has(entry) ? "[hidden] " : ""}{entry.split("/").pop()}
              </button>
            ))}
          </div>

          {archiveFiles.map((entry, i) => (
            <ArchiveEntryRenderer
              key={entry}
              filename={filename}
              entry={entry}
              entryIndex={i}
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
