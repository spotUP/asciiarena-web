export type ReleaseTextEncoding = "auto" | "cp437";

// Markers that some .TXT files embed to inline their file_id.diz content.
export const BEGIN_FILE_ID_DIZ = "@BEGIN_FILE_ID.DIZ";
export const END_FILE_ID_DIZ = "@END_FILE_ID.DIZ";

const CP437_HIGH_CODEPOINTS = [
  0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7,
  0x00ea, 0x00eb, 0x00e8, 0x00ef, 0x00ee, 0x00ec, 0x00c4, 0x00c5,
  0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9,
  0x00ff, 0x00d6, 0x00dc, 0x00a2, 0x00a3, 0x00a5, 0x20a7, 0x0192,
  0x00e1, 0x00ed, 0x00f3, 0x00fa, 0x00f1, 0x00d1, 0x00aa, 0x00ba,
  0x00bf, 0x2310, 0x00ac, 0x00bd, 0x00bc, 0x00a1, 0x00ab, 0x00bb,
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556,
  0x2555, 0x2563, 0x2551, 0x2557, 0x255d, 0x255c, 0x255b, 0x2510,
  0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x255e, 0x255f,
  0x255a, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x2567,
  0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256b,
  0x256a, 0x2518, 0x250c, 0x2588, 0x2584, 0x258c, 0x2590, 0x2580,
  0x03b1, 0x00df, 0x0393, 0x03c0, 0x03a3, 0x03c3, 0x00b5, 0x03c4,
  0x03a6, 0x0398, 0x03a9, 0x03b4, 0x221e, 0x03c6, 0x03b5, 0x2229,
  0x2261, 0x00b1, 0x2265, 0x2264, 0x2320, 0x2321, 0x00f7, 0x2248,
  0x00b0, 0x2219, 0x00b7, 0x221a, 0x207f, 0x00b2, 0x25a0, 0x00a0,
];

export function decodeCp437Bytes(bytes: Uint8Array): string {
  return Array.from(bytes, byte => {
    if (byte < 0x80) return String.fromCharCode(byte);
    return String.fromCodePoint(CP437_HIGH_CODEPOINTS[byte - 0x80]);
  }).join("");
}

export interface FileIdDizResult {
  /** The text with the @BEGIN_FILE_ID.DIZ ... @END_FILE_ID.DIZ block removed. */
  content: string;
  /** The text between the markers, or null if no markers were found. */
  dizText: string | null;
}

/** Strip embedded file_id.diz markers and return the extracted content.
 *  Safe to call on HTML-escaped text — the markers contain no HTML special chars. */
export function stripFileIdDiz(text: string): FileIdDizResult {
  const beginIdx = text.indexOf(BEGIN_FILE_ID_DIZ);
  const endIdx = text.indexOf(END_FILE_ID_DIZ);
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    return { content: text, dizText: null };
  }
  const dizStart = beginIdx + BEGIN_FILE_ID_DIZ.length;
  const dizText = text.substring(dizStart, endIdx).trim();
  let endMarkerEnd = endIdx + END_FILE_ID_DIZ.length;
  // eat any trailing CR/LF so the surrounding text doesn't get a phantom blank line
  if (text[endMarkerEnd] === "\r") endMarkerEnd++;
  if (text[endMarkerEnd] === "\n") endMarkerEnd++;
  return { content: text.substring(0, beginIdx) + text.substring(endMarkerEnd), dizText: dizText || null };
}

/** Decode bytes as Latin-1 (ISO-8859-1): every byte maps 1:1 to its codepoint.
 *  This is the Amiga / non-PC high range (e.g. 0xB4 ´, 0xF7 ÷). */
export function decodeLatin1Bytes(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

export function decodeReleaseText(bytes: Uint8Array, encoding: ReleaseTextEncoding): string {
  if (encoding === "cp437") return decodeCp437Bytes(bytes);

  try {
    const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // CP437 files with box-drawing / block chars (0xC0-0xDF) often form
    // accidental valid UTF-8 sequences: e.g. ╒═ (0xD5 0xCD) decodes as a
    // single 2-byte character instead of two glyphs, shifting art left.
    // Heuristic: if ≥80% of the high bytes survived as distinct non-ASCII
    // chars, it's genuine UTF-8. If multi-byte sequences consumed many
    // high bytes, it's CP437 in disguise — re-decode as CP437.
    const highByteCount = bytes.reduce((c, b) => c + (b >= 0x80 ? 1 : 0), 0);
    // Only re-decode when there are enough high bytes to be confident
    // it's an art file, not a UTF-8 snippet like "café".
    if (highByteCount >= 16) {
      const nonAsciiChars = [...utf8].filter(c => c.codePointAt(0)! >= 0x80).length;
      // Each valid multi-byte UTF-8 sequence turns 2-4 high bytes into 1 char.
      // If we lost >20% of them, it's CP437 box-art in disguise, not UTF-8.
      if (nonAsciiChars < highByteCount * 0.8) {
        return decodeCp437Bytes(bytes);
      }
    }
    return utf8;
  } catch {
    // Not valid UTF-8. aSCIIaRENA is an Amiga-first site: "auto" (non-PC)
    // releases are Amiga / ASCII art using the Latin-1 high range — e.g.
    // 0xB4 ´ and 0xF7 ÷ as decoration — NOT CP437 box-drawing. Decoding
    // these as CP437 turns ´/÷ into ┤/≈ and mangles the art. Genuine PC /
    // CP437 art is explicitly typed and handled by the "cp437" branch above.
    return decodeLatin1Bytes(bytes);
  }
}

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function encodeReleaseText(bytes: Uint8Array, encoding: ReleaseTextEncoding): string {
  // Normalise DOS line endings — \r\n or standalone \r → \n.
  // Some browsers render \r inside <pre> as an extra blank line,
  // which creates visible gaps between rows of CP437 block art.
  const raw = decodeReleaseText(bytes, encoding)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Strip control characters (except \t \n) that can confuse
    // HTML parsers or cause unexpected vertical spacing in <pre>.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return escapeHtmlText(raw);
}

export function isCp437ReleaseType(type: string | null | undefined): boolean {
  const normalizedType = (type ?? "").trim().toUpperCase();
  return normalizedType === "CP437" || normalizedType === "PC" || normalizedType === "PC ASCII";
}

export function releaseTextEncoding(
  type: string | null | undefined,
  brokenComment: string | null | undefined,
): ReleaseTextEncoding {
  const normalizedComment = (brokenComment ?? "").toLowerCase();
  return isCp437ReleaseType(type) || normalizedComment.includes("pc charset")
    ? "cp437"
    : "auto";
}

// ANSI 8-color palette matching the site's retro aesthetic
const ANSI_FG_COLORS: Record<string, string> = {
  "undefined": "", // initial state
  "0":  "",        // reset
  "30": "#111111", // black
  "31": "#ff5555", // red
  "32": "#55ff55", // green
  "33": "#ffff55", // yellow
  "34": "#5555ff", // blue
  "35": "#ff55ff", // magenta
  "36": "#55ffff", // cyan
  "37": "#aaaaaa", // white/grey
};
const ANSI_BG_COLORS: Record<string, string> = {
  "undefined": "",
  "40": "#111111", // black bg
  "41": "#ff5555", // red bg
  "42": "#55ff55", // green bg
  "43": "#ffff55", // yellow bg
  "44": "#5555ff", // blue bg
  "45": "#ff55ff", // magenta bg
  "46": "#55ffff", // cyan bg
  "47": "#aaaaaa", // white/grey bg
};

/**
 * Convert ANSI SGR escape codes (ESC[...m) to HTML <span> elements.
 * Safe to call on already-HTML-escaped text — ESC, [, digits, and ;
 * are never HTML-escaped. Each color span auto-closes on the next code
 * or at end of input — no color leaking.
 */
export function convertAnsiCodes(html: string): string {
  if (html.indexOf("\x1b") === -1) return html;

  let open = false;
  let fg = "undefined";
  let bg = "undefined";
  const result = html.replace(
    /\x1b\[(\d+)m/g,
    (_match, code: string) => {
      if (code === "0") {
        fg = "undefined"; bg = "undefined";
        const close = open ? "</span>" : "";
        open = false;
        return close;
      }
      const fgColor = ANSI_FG_COLORS[code];
      const bgColor = ANSI_BG_COLORS[code];
      if (fgColor !== undefined) fg = code;
      if (bgColor !== undefined) bg = code;
      if (fgColor === undefined && bgColor === undefined) return ""; // unsupported, strip
      const close = open ? "</span>" : "";
      const fgc = ANSI_FG_COLORS[fg] || "inherit";
      const bgc = ANSI_BG_COLORS[bg] || "inherit";
      const style = `color:${fgc};background-color:${bgc};line-height:1`;
      open = true;
      return `${close}<span style="${style}">`;
    },
  );

  return open ? result + "</span>" : result;
}

/** Return true if the text contains ANSI escape codes (ESC[...m). */
export function hasAnsiCodes(text: string): boolean {
  return /\x1b\[\d+m/.test(text);
}

export function releaseViewerType(type: string | null | undefined): string {
  const normalizedType = (type ?? "ASCII").trim().toUpperCase();
  return isCp437ReleaseType(normalizedType) ? "ASCII" : normalizedType;
}