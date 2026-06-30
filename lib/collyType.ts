import { hasAnsiCodes, decodeLatin1Bytes, looksLikeCp437Art } from "./releaseText";

// Single source of truth for "what kind of colly is this file?", by CONTENT (not
// just extension) so an ANSI colly saved as .txt is still recognised as ANSI.
// Shared by the submit form, the dry-run tester, and the upload/preview APIs.
export type CollyType = "ASCII" | "ANSI" | "CP437" | "ARCHIVE";

export const COLLY_TYPES: CollyType[] = ["ASCII", "ANSI", "CP437", "ARCHIVE"];

const ARCHIVE_EXTS = ["dms", "lzh", "lha", "zip", "rar", "7z", "gz", "arj"];

export function detectCollyType(bytes: Uint8Array, filename: string): CollyType {
  const ext = (filename.toLowerCase().split(".").pop() ?? "").trim();
  if (ARCHIVE_EXTS.includes(ext)) return "ARCHIVE";
  // Look only at the visible art (before the Ctrl-Z metadata trailer).
  const sub = bytes.indexOf(0x1a);
  const visible = sub === -1 ? bytes : bytes.subarray(0, sub);
  if (ext === "ans") return "ANSI";
  if (hasAnsiCodes(decodeLatin1Bytes(visible))) return "ANSI";
  if (looksLikeCp437Art(visible)) return "CP437";
  return "ASCII";
}
