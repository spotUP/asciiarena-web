import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { filterAdFiles, isAdFile } from "./archive-ad-filter";

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
      const ext = name.toLowerCase().split(".").pop() ?? "";
      if (!["ans", "ansi", "asc", "nfo", "txt"].includes(ext)) continue;
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
      const ext = name.toLowerCase().split(".").pop() ?? "";
      if (!["ans", "ansi", "asc", "nfo", "txt"].includes(ext)) continue;
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

    // Pick the largest renderable file — actual ASCII art is orders of
    // magnitude bigger than BBS ad screens or design templates.
    const entry = entries[0].name;
    const data = execSync(`${LHA_BIN} pq "${fp}" "${entry}"`, {
      encoding: "buffer",
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024,
    });

    // `lha pq` (quiet) writes the raw file with no header — use it as-is.
    return { data, entry };
  } catch {
    return null;
  }
}
