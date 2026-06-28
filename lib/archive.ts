import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { filterAdFiles, isAdFile } from "./archive-ad-filter";
import { isRenderableArt } from "./releaseText";

// Known binary file types. This is ONLY a cheap pre-filter so we don't extract
// large image/audio/archive blobs just to reject them — art is never found by
// extension, it's confirmed by content (isRenderableArt). Files with any other
// extension (or none, e.g. "bis.2kADbig") are kept as candidates and validated
// by content.
const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "bmp", "iff", "ilbm", "lbm", "pcx", "tga", "webp", "ico",
  "mod", "xm", "s3m", "it", "mp3", "ogg", "wav", "aiff", "mid", "med", "okt",
  "exe", "com", "dll", "prg", "adf", "img", "rom", "o", "so",
  "zip", "lha", "lzh", "rar", "gz", "bz2", "7z", "arj", "tar", "z",
  "pdf", "ttf", "otf", "fon", "woff", "woff2",
]);

function hasBinaryExtension(name: string): boolean {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return BINARY_EXTENSIONS.has(ext);
}

export const LHA_BIN = process.env.LHA_BIN ?? "/usr/bin/lha";
export const COLLECTIONS_PATH = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");

export function archivePath(filename: string): string {
  const dirname = filename.replace(/\.[^.]+$/, "");
  return path.join(COLLECTIONS_PATH, dirname, filename);
}

/**
 * Parse `lha l` output. Lines look like:
 *  [generic]         1024  2024-01-15  file_id.diz
 *  -rw-r--r--  1234/5678     5678  2024-01-15  art.ans
 */
export interface LhaEntry {
  name: string;
  size: number;
}

export function parseLhaList(output: string): string[] {
  const files: string[] = [];
  let inListing = false;
  for (const line of output.split("\n")) {
    if (line.startsWith("----------")) { inListing = !inListing; continue; }
    if (!inListing) continue;
    if (line.startsWith(" Total")) break;
    // lha listing format: [method] [perms] [uid/gid] SIZE RATIO% Mon DD YYYY|HH:MM FILENAME
    // Filenames may contain spaces (e.g. "[ A n d t h e o d d s ? ]/m's-odds.txt").
    // Match from the date column to end-of-line to capture the full path.
    const m = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+(\d{4}|\d{2}:\d{2})\s+(.+)$/);
    if (m) {
      const name = m[3];
      if (name.endsWith("/")) continue;
      // Keep every non-binary file as a candidate — art has no fixed extension
      // (logos are named e.g. "bis.2kADbig"). Content is validated downstream.
      if (hasBinaryExtension(name)) continue;
      files.push(name);
    }
  }
  // Filter out BBS ad/spam files from the display listing.
  // The archive itself is never modified — this only affects what we show.
  return filterAdFiles(files);
}

/**
 * Same as parseLhaList but includes file sizes. Used to pick the best
 * file for inline extraction (largest renderable = actual art).
 */
export function parseLhaListWithSizes(output: string): LhaEntry[] {
  const entries: LhaEntry[] = [];
  let inListing = false;
  for (const line of output.split("\n")) {
    if (line.startsWith("----------")) { inListing = !inListing; continue; }
    if (!inListing) continue;
    if (line.startsWith(" Total")) break;
    // Capture size as well: SIZE is the 4th whitespace-delimited field in the line
    // Format: [method]  [perms/uid/gid...]  SIZE  RATIO%  Mon DD YYYY|HH:MM  FILENAME
    const parts = line.trim().split(/\s+/);
    // Find the size field: the first all-digit field before the date
    let size = 0;
    for (let i = 1; i < parts.length; i++) {
      if (/^\d+$/.test(parts[i]) && i + 1 < parts.length && /^\d+\.?\d*%$/.test(parts[i + 1])) {
        size = parseInt(parts[i]);
        break;
      }
    }
    const m = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+(\d{4}|\d{2}:\d{2})\s+(.+)$/);
    if (m) {
      const name = m[3];
      if (name.endsWith("/")) continue;
      if (hasBinaryExtension(name)) continue;
      entries.push({ name, size });
    }
  }
  // Filter BBS ads, then sort largest first (actual art is biggest)
  const filtered = entries.filter(e => !isAdFile(e.name));
  filtered.sort((a, b) => b.size - a.size);
  return filtered;
}

/**
 * Convert 8-bit CSI (single byte 0x9B) to the 7-bit ESC[ form (0x1B 0x5B).
 * AnsiLove only recognises "ESC[", so files that use the single-byte CSI
 * render their control codes as literal text unless normalised first.
 */
export function normalizeCsi(data: Buffer): Buffer {
  let csiCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 0x9b) csiCount++;
  }
  if (csiCount === 0) return data;

  const out = Buffer.alloc(data.length + csiCount);
  let j = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 0x9b) {
      out[j++] = 0x1b;
      out[j++] = 0x5b;
    } else {
      out[j++] = data[i];
    }
  }
  return out;
}

export interface ArchiveContent {
  /** Raw bytes of the extracted file, with lha pq header stripped. */
  data: Buffer;
  /** The filename within the archive. */
  entry: string;
}

/**
 * List renderable files in an LHA archive and extract the first one.
 * Returns null if the archive doesn't exist or contains no renderable files.
 */
export function extractFirstRenderable(filename: string): ArchiveContent | null {
  const fp = archivePath(filename);
  if (!existsSync(fp)) return null;

  try {
    const listing = execSync(`${LHA_BIN} l "${fp}"`, { encoding: "buffer", timeout: 10000 }).toString("latin1");
    const entries = parseLhaListWithSizes(listing);
    if (entries.length === 0) return null;

    // Walk candidates largest-first and return the first whose CONTENT is
    // actually renderable art (extension is not trusted). `lha pq` (quiet)
    // writes the raw file with no header — use it as-is.
    for (const { name } of entries) {
      try {
        const data = execSync(`${LHA_BIN} pq "${fp}" "${name}"`, {
          encoding: "buffer",
          timeout: 10000,
          maxBuffer: 10 * 1024 * 1024,
        });
        if (isRenderableArt(new Uint8Array(data))) return { data, entry: name };
      } catch { /* unreadable/oversized — skip to next candidate */ }
    }
    return null;
  } catch {
    return null;
  }
}
