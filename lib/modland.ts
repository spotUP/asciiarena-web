// Modland client — talks to our own same-origin proxy (/api/modland/*), which
// forwards to the public DEViLBOX Modland API (FTS5 index of ~190k modules +
// a caching download proxy to ftp.modland.com). Same-origin keeps us within the
// site's COEP policy and avoids CORS.

export interface ModlandFile {
  id: number;
  format: string;
  author: string;
  filename: string;
  full_path: string;
  extension: string;
  avg_rating?: number;
  vote_count?: number;
}

export interface ModlandSearchResult {
  results: ModlandFile[];
  limit: number;
  offset: number;
  query: string;
}

// UADE plays ProTracker + Amiga custom formats, NOT the PC trackers below.
// (Playing those would need libopenmpt — out of scope for this player.)
const PC_FORMATS = new Set([
  "fasttracker 2", "fasttracker", "impulsetracker", "screamtracker 3",
  "screamtracker", "multitracker", "composer 669", "digital tracker",
]);
// Standalone-unplayable companion/instrument files that show up in search.
const COMPANION_EXT = new Set(["instr", "ss", "ins", "smp", "set", "nt", "ssd", "sample"]);

// Side files that are companions to a main module, not playable on their own.
// (TFMX is the exception: "mdat.*" IS the main file, "smpl.*" is its companion.)
const COMPANION_PREFIX = ["smpl.", "smp.", "ssd.", "ins.", "sset.", "set."];

/** Whether a Modland file is something our UADE engine can actually play. */
export function isUadePlayable(f: ModlandFile): boolean {
  if (PC_FORMATS.has(f.format.toLowerCase())) return false;
  if (COMPANION_EXT.has(f.extension.toLowerCase())) return false;
  if (/\/instruments?\//i.test(f.full_path)) return false;
  const base = (f.filename.split("/").pop() || f.filename).toLowerCase();
  if (COMPANION_PREFIX.some((p) => base.startsWith(p))) return false;
  return true;
}

// Formats UADE CANNOT play — PC trackers and Atari-Falcon/PC formats. Random
// draws from every other Modland format (UADE handles ~130 Amiga formats), so
// the denylist is tiny and the pool is huge.
export const UADE_RANDOM_DENY = new Set([
  "fasttracker 2", "fasttracker", "impulsetracker", "screamtracker 3", "screamtracker 2",
  "multitracker", "composer 669", "ultratracker", "openmpt mptm", "farandole composer",
  "digital tracker dtm", "digital tracker mod", "graoumf tracker", "graoumf tracker 2",
  "tcb tracker",
]);

// Small reliable fallback pool, used only if the per-format counts can't be
// fetched (so random still works without the weighting data).
export const UADE_RANDOM_FORMATS = [
  "Protracker", "Soundtracker", "OctaMED MMD1", "AHX", "TFMX",
  "Delitracker Custom", "IFF-SMUS", "Future Composer 1.4",
];

export interface ModlandFormatCount {
  format: string;
  count: number;
}

/** Per-format module counts from the upstream index (for weighting random). */
export async function getModlandFormats(): Promise<ModlandFormatCount[]> {
  try {
    const r = await fetch("/api/modland/formats");
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.formats) ? (j.formats as ModlandFormatCount[]) : [];
  } catch {
    return [];
  }
}

// Pick a random UADE-playable format, weighted by sqrt(count). The pool is every
// Modland format except the PC/Falcon ones UADE can't play. sqrt dampens the
// weighting so giant formats (Protracker ~80k) stay the plurality without
// drowning out everything else, while tiny formats (TFMX ~700) become rare
// instead of equally likely. `rand` is a 0..1 value (injected for testing).
export function chooseRandomFormat(
  counts: ModlandFormatCount[],
  rand: number,
): ModlandFormatCount | null {
  const pool = counts.filter((c) => c.count > 0 && !UADE_RANDOM_DENY.has(c.format.toLowerCase()));
  if (!pool.length) return null;
  const weights = pool.map((c) => Math.sqrt(c.count));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rand * total;
  for (let i = 0; i < pool.length; i++) {
    x -= weights[i];
    if (x <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// A random offset spanning the WHOLE format (not just the first page), so random
// reaches the entire catalog. Returns the start of a `limit`-sized window.
export function randomOffset(count: number, limit: number, rand: number): number {
  if (count <= limit) return 0;
  const maxStart = count - limit;
  return Math.min(maxStart, Math.floor(rand * (maxStart + 1)));
}

export async function searchModland(params: {
  q?: string;
  format?: string;
  author?: string;
  limit?: number;
  offset?: number;
}): Promise<ModlandSearchResult> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.format) sp.set("format", params.format);
  if (params.author) sp.set("author", params.author);
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.offset) sp.set("offset", String(params.offset));
  const r = await fetch(`/api/modland/search?${sp}`);
  if (!r.ok) throw new Error("Search failed");
  return r.json();
}

export async function downloadModlandFile(fullPath: string): Promise<ArrayBuffer> {
  const r = await fetch(`/api/modland/download?path=${encodeURIComponent(fullPath)}`);
  if (!r.ok) {
    if (r.status === 429) throw new Error("Rate limited — try again in a moment");
    throw new Error("Download failed");
  }
  return r.arrayBuffer();
}

// ── Companion files (two-file Amiga formats) ────────────────────────────────
// Ported from DEViLBOX src/lib/modlandApi.ts.

function isLikelyStartrekkerAM(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 1084) return false;
  const bytes = new Uint8Array(buffer, 1080, 4);
  let magic = "";
  for (const b of bytes) magic += String.fromCharCode(b);
  return magic === "FLT4" || magic === "FLT8" || magic === "EX04" || magic === "EX08";
}

/** TFMX-Pro: mdat.<name> needs the smpl.<name> companion. */
export async function downloadTFMXCompanion(
  mdatPath: string,
): Promise<{ filename: string; buffer: ArrayBuffer } | null> {
  const lastSlash = mdatPath.lastIndexOf("/");
  const dir = lastSlash >= 0 ? mdatPath.slice(0, lastSlash + 1) : "";
  const basename = lastSlash >= 0 ? mdatPath.slice(lastSlash + 1) : mdatPath;
  if (!basename.toLowerCase().startsWith("mdat.")) return null;
  const smplBasename = "smpl." + basename.slice(5);
  try {
    const buffer = await downloadModlandFile(dir + smplBasename);
    return { filename: smplBasename, buffer };
  } catch {
    return null;
  }
}

/** Other UADE two-file formats (Jason Page, MFP, Richard Joseph, Startrekker AM, Sonix). */
export async function downloadUADECompanions(
  mainPath: string,
  mainBuffer?: ArrayBuffer,
): Promise<Array<{ filename: string; buffer: ArrayBuffer }>> {
  const lastSlash = mainPath.lastIndexOf("/");
  const dir = lastSlash >= 0 ? mainPath.slice(0, lastSlash + 1) : "";
  const basename = lastSlash >= 0 ? mainPath.slice(lastSlash + 1) : mainPath;
  const lower = basename.toLowerCase();
  const companions: Array<{ filename: string; buffer: ArrayBuffer }> = [];

  const tryDownload = async (name: string) => {
    try {
      companions.push({ filename: name, buffer: await downloadModlandFile(dir + name) });
    } catch {
      /* non-fatal */
    }
  };

  if (lower.startsWith("jpn.") || lower.startsWith("jpnd.") || lower.startsWith("jp.") ||
      lower.startsWith("jpo.") || lower.startsWith("jpold.")) {
    await tryDownload("smp." + basename.slice(basename.indexOf(".") + 1));
  }
  if (lower.startsWith("mfp.")) await tryDownload("smp." + basename.slice(4));
  if (lower.endsWith(".dum") || lower.endsWith(".sng")) {
    const noExt = basename.slice(0, basename.lastIndexOf("."));
    await tryDownload(noExt + ".ins");
    await tryDownload(noExt + ".INS");
  }
  if (lower.endsWith(".mod") && (!mainBuffer || isLikelyStartrekkerAM(mainBuffer))) {
    await tryDownload(basename.slice(0, -4) + ".nt");
  }
  if (lower.endsWith(".smus") || lower.endsWith(".dum")) {
    const noExt = basename.slice(0, basename.lastIndexOf("."));
    await tryDownload(noExt + ".ss");
    await tryDownload(noExt + ".instr");
  }
  return companions;
}
