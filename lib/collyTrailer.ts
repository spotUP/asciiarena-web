import { decodeLatin1Bytes } from "./releaseText";
import { FONTS } from "./ansilove";
import { inkBoundsIn, type LogoSection } from "./logoSections";

// Invisible per-colly metadata carried AFTER the Ctrl-Z (0x1A) EOF byte — every
// renderer stops at 0x1A, so the trailer never shows in the art. Two flavours are
// accepted: a standard SAUCE record (binary, last 128 bytes) and/or plain
// `key: value` lines. Operates on RAW BYTES because SAUCE is binary and the text
// decoder strips 0x1A. Nothing here is required — it only augments rendering.

export interface CollyMeta {
  title?: string;
  author?: string;     // artist
  crew?: string;       // group
  date?: string;       // "YYYY-MM-DD"
  font?: string;       // a FONTS value, e.g. "TopazPlus_a1200"
  fg?: string;         // "#rrggbb"
  bg?: string;         // "#rrggbb"
  soundtrack?: string; // Modland full_path
  width?: number;
  // Explicit logo map: the artist (or the dry-run editor) pins each logo to a
  // start line (+ optional end line for the logo's extent) + caption, so
  // rendering/jumps skip the island-detection heuristic.
  logos?: { line: number; end?: number; caption: string }[];
}

const SUB = 0x1a; // Ctrl-Z / DOS EOF

// --- font name resolution -------------------------------------------------

// SAUCE font names + common spellings → our FONTS value.
const SAUCE_FONT_ALIASES: Record<string, string> = {
  "amigatopaz1": "Topaz_a500",
  "amigatopaz1plus": "TopazPlus_a500",
  "amigatopaz2": "Topaz_a1200",
  "amigatopaz2plus": "TopazPlus_a1200",
  "amigamicroknight": "MicroKnight",
  "amigamicroknightplus": "MicroKnightPlus",
  "amigapotnoodle": "P0T-NOoDLE",
  "amigamosoul": "mOsOul",
};

const norm = (s: string) => s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]/g, "");

/** Map an artist-supplied / SAUCE font name to a FONTS value, or undefined. */
export function resolveFont(name: string): string | undefined {
  const n = norm(name);
  if (!n) return undefined;
  for (const f of FONTS) if (norm(f.value) === n || norm(f.label) === n) return f.value;
  return SAUCE_FONT_ALIASES[n];
}

// --- colour parsing -------------------------------------------------------

const NAMED_COLORS: Record<string, string> = {
  black: "#111111", red: "#ff5555", green: "#55ff55", yellow: "#ffff55",
  blue: "#5555ff", magenta: "#ff55ff", cyan: "#55ffff", white: "#aaaaaa",
  grey: "#aaaaaa", gray: "#aaaaaa",
};

function parseColor(v: string): string | undefined {
  const s = v.trim().toLowerCase();
  if (NAMED_COLORS[s]) return NAMED_COLORS[s];
  const hex = s.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  return undefined;
}

// --- SAUCE record ---------------------------------------------------------

const latin1 = (b: Uint8Array) => decodeLatin1Bytes(b);
const cstr = (b: Uint8Array) => { const s = latin1(b); const z = s.indexOf("\0"); return (z === -1 ? s : s.slice(0, z)).trim(); };

/** Offset of a trailing SAUCE record, or -1. */
function sauceOffset(bytes: Uint8Array): number {
  if (bytes.length < 128) return -1;
  const off = bytes.length - 128;
  return latin1(bytes.subarray(off, off + 7)) === "SAUCE00" ? off : -1;
}

function parseSauce(bytes: Uint8Array): CollyMeta | null {
  const off = sauceOffset(bytes);
  if (off === -1) return null;
  const meta: CollyMeta = {};
  const title = cstr(bytes.subarray(off + 7, off + 42));
  const author = cstr(bytes.subarray(off + 42, off + 62));
  const group = cstr(bytes.subarray(off + 62, off + 82));
  const date = latin1(bytes.subarray(off + 82, off + 90)); // CCYYMMDD
  const tinfo1 = bytes[off + 96] | (bytes[off + 97] << 8); // width
  const fontName = cstr(bytes.subarray(off + 106, off + 128)); // TInfoS
  if (title) meta.title = title;
  if (author) meta.author = author;
  if (group) meta.crew = group;
  if (/^\d{8}$/.test(date)) meta.date = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  if (tinfo1 > 0) meta.width = tinfo1;
  if (fontName) { const f = resolveFont(fontName); if (f) meta.font = f; }
  return meta;
}

// --- key: value trailer ---------------------------------------------------

function parseKeyValue(text: string): CollyMeta {
  const meta: CollyMeta = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const m = /^\s*([a-z_]+)\s*[:=]\s*(.+?)\s*$/i.exec(rawLine);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2];
    switch (key) {
      case "title": meta.title = val; break;
      case "author": case "artist": meta.author = val; break;
      case "crew": case "group": meta.crew = val; break;
      case "date": {
        const d = val.replace(/[^0-9]/g, "");
        if (/^\d{8}$/.test(d)) meta.date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        else if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) meta.date = val.trim();
        break;
      }
      case "font": { const f = resolveFont(val); if (f) meta.font = f; break; }
      case "fg": case "foreground": { const c = parseColor(val); if (c) meta.fg = c; break; }
      case "bg": case "background": { const c = parseColor(val); if (c) meta.bg = c; break; }
      case "soundtrack": case "music": case "tune": meta.soundtrack = val; break;
      case "logo": {
        const mm = /^(\d+)(?:-(\d+))?\s+(.+)$/.exec(val);
        if (mm) (meta.logos ??= []).push({ line: parseInt(mm[1], 10), end: mm[2] ? parseInt(mm[2], 10) : undefined, caption: mm[3].trim() });
        break;
      }
      default: break;
    }
  }
  return meta;
}

// --- public API -----------------------------------------------------------

/** Split the visible art from its (optional) metadata trailer and parse it.
 *  `visible` is everything before the Ctrl-Z EOF and any trailing SAUCE/COMNT. */
export function parseCollyBytes(bytes: Uint8Array): { visible: Uint8Array; meta: CollyMeta } {
  const sauce = parseSauce(bytes);

  // Visible art ends at the earliest of: the Ctrl-Z EOF, or the SAUCE/COMNT block.
  let end = bytes.length;
  const sub = bytes.indexOf(SUB);
  if (sub !== -1) end = Math.min(end, sub);
  const sOff = sauceOffset(bytes);
  if (sOff !== -1) {
    let blockStart = sOff;
    const comments = bytes[sOff + 104];
    if (comments > 0) {
      const comntStart = sOff - (5 + 64 * comments);
      if (comntStart >= 0 && latin1(bytes.subarray(comntStart, comntStart + 5)) === "COMNT") {
        blockStart = comntStart;
      }
    }
    end = Math.min(end, blockStart);
  }

  // key:value trailer = the text between the Ctrl-Z and any SAUCE/COMNT block.
  let kv: CollyMeta = {};
  if (sub !== -1) {
    const trailerEnd = sOff !== -1 ? Math.min(sOff, bytes.length) : bytes.length;
    if (trailerEnd > sub + 1) kv = parseKeyValue(latin1(bytes.subarray(sub + 1, trailerEnd)));
  }

  // SAUCE wins for the fields it carries; key:value fills the rest (soundtrack,
  // fg/bg, the logo map — which SAUCE has no standard slots for).
  const meta: CollyMeta = { ...kv, ...(sauce ?? {}) };
  if (kv.logos) meta.logos = kv.logos;
  return { visible: bytes.subarray(0, end), meta };
}

/** Build exact logo sections from an artist-provided line map (1-based lines),
 *  so rendering/autoplay/jumps don't need the island-detection heuristic. Each
 *  logo spans from its line to just before the next one's. */
/**
 * `text` is optional only for callers that genuinely have no text (canvas art
 * measured elsewhere). Pass it whenever you have it: without it the ink box
 * falls back to the mapped range, and autoplay centres the RANGE rather than
 * the art. A tagger who drags a little padding above or below a logo -- or who
 * marks a start with no explicit end, so the range runs to the next logo --
 * then sees the logo sitting off-centre.
 */
export function sectionsFromLogoMap(
  logos: { line: number; end?: number; caption: string }[],
  totalLines: number,
  text?: string,
): LogoSection[] {
  const sorted = [...logos].sort((a, b) => a.line - b.line);
  return sorted.map((lg, i) => {
    const startLine = Math.max(0, lg.line - 1); // author counts 1-based
    const nextStart = i + 1 < sorted.length ? Math.max(0, sorted[i + 1].line - 1) : totalLines;
    // Use the explicit end (the dragged extent) when given, else span to the next.
    const endLine = lg.end && lg.end >= lg.line ? Math.max(startLine, lg.end - 1) : Math.max(startLine, nextStart - 1);
    const ink = text
      ? inkBoundsIn(text, startLine, endLine)
      : { inkTop: startLine, inkBottom: endLine };
    return { startLine, endLine, lineCount: endLine - startLine + 1, ...ink };
  });
}
