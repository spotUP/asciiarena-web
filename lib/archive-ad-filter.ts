/**
 * BBS ad filename filter for archive listings.
 *
 * Archives from the Amiga BBS scene often contain ad/spam files alongside
 * the actual art. We filter them from the display listing but NEVER strip
 * them from the archive itself.
 *
 * The amiexpress project maintains a comprehensive database of BBS ad
 * filename patterns (scene-strip-patterns.json). We use those as the
 * primary signal, with a critical safety net: only root-level files are
 * filtered. Actual art is almost always in subdirectories.
 */

import patternsDb from "./archive-ad-patterns.json";

/** Pre-compiled regexes from the amiexpress filename pattern database. */
let _amiexpressRegexes: RegExp[] | null = null;

function getAmiexpressRegexes(): RegExp[] {
  if (_amiexpressRegexes) return _amiexpressRegexes;
  _amiexpressRegexes = [];
  for (const pat of (patternsDb as { filenamePatterns: string[] }).filenamePatterns) {
    try {
      // Convert glob to regex: escape special chars, then * → .*, ? → .
      let r = pat.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      r = r.replace(/\\\*/g, ".*");
      r = r.replace(/\\\?/g, ".");
      _amiexpressRegexes.push(new RegExp("^" + r + "$", "i"));
    } catch { /* skip malformed patterns */ }
  }
  return _amiexpressRegexes;
}

/** Supplemental patterns for ad styles the amiexpress DB misses. */
const SUPPLEMENTAL_PATTERNS: RegExp[] = [
  // Leetspeak / mixed-case promo filenames (e.g. fOCKEN-nICE.txt)
  /^[a-z][A-Z]{2,}.*\.(txt|nfo)$/i,
];

/**
 * Return true if the file's base name (no directory) matches a known BBS
 * ad pattern from the amiexpress database.
 */
function matchesAdPattern(basename: string): boolean {
  if (basename.toLowerCase() === "file_id.diz") return false;
  if (SUPPLEMENTAL_PATTERNS.some((r) => r.test(basename))) return true;
  return getAmiexpressRegexes().some((r) => r.test(basename));
}

/**
 * Return true if the filename (full archive path) looks like a BBS ad
 * that should be hidden from the archive file listing.
 *
 * Safety net: only root-level files (no "/" in path) are filtered.
 * BBS ads are almost always placed at the archive root. Actual art files
 * live in subdirectories and are never filtered by name alone.
 */
export function isAdFile(filename: string): boolean {
  // Files in subdirectories are art — never filter by name
  if (filename.includes("/")) return false;

  const base = filename.split("/").pop() ?? filename;
  return matchesAdPattern(base);
}

/**
 * Filter a list of archive entry paths, removing BBS ad files.
 * Only root-level files are considered for filtering.
 */
export function filterAdFiles(files: string[]): string[] {
  return files.filter((f) => !isAdFile(f));
}
