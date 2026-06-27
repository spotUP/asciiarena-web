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

export function decodeReleaseText(bytes: Uint8Array, encoding: ReleaseTextEncoding): string {
  if (encoding === "cp437") return decodeCp437Bytes(bytes);

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return Array.from(bytes, byte => String.fromCharCode(byte)).join("");
  }
}

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function encodeReleaseText(bytes: Uint8Array, encoding: ReleaseTextEncoding): string {
  return escapeHtmlText(decodeReleaseText(bytes, encoding));
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

export function releaseViewerType(type: string | null | undefined): string {
  const normalizedType = (type ?? "ASCII").trim().toUpperCase();
  return isCp437ReleaseType(normalizedType) ? "ASCII" : normalizedType;
}