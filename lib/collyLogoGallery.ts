import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { cleanLabel } from "@/lib/handleMatch";
import { urlsafe } from "@/lib/utils";

export interface GalleryLogo {
  filename: string;
  collyName: string | null;
  label: string;
  line: number; // 0-based start line, for the #logo-N deep link
  snippet: string[]; // the logo's actual ASCII lines, sliced from content_text
  entity: { name: string; kind: "artist" | "crew"; url: string } | null;
}

interface RawRow {
  filename: string;
  name: string | null;
  start_line: number;
  end_line: number | null;
  label: string;
  content_text: string | null;
  artist: string | null;
  artisturl: string | null;
  crew: string | null;
}

// How many lines to show when a logo has no explicit end (detected rows store
// null end_line) — a fixed preview window from the start line.
const PREVIEW_WINDOW = 11;
const MAX_SNIPPET_LINES = 24;
const MAX_LINE_LEN = 80;

export function sliceSnippet(content: string, start0: number, end0: number | null): string[] {
  const lines = content.split(/\r?\n/);
  const end = (end0 != null && end0 >= start0 ? end0 : start0 + PREVIEW_WINDOW);
  const out = lines
    .slice(start0, Math.min(end + 1, start0 + MAX_SNIPPET_LINES))
    .map((l) => (l.length > MAX_LINE_LEN ? l.slice(0, MAX_LINE_LEN) : l));
  // Trim leading/trailing blank lines so the snippet sits tight.
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

function shape(r: RawRow): GalleryLogo {
  return {
    filename: r.filename,
    collyName: r.name,
    label: cleanLabel(r.label),
    line: r.start_line,
    snippet: sliceSnippet(r.content_text ?? "", r.start_line, r.end_line),
    entity: r.artist
      ? { name: r.artist, kind: "artist", url: `/artist/${r.artisturl ?? urlsafe(r.artist)}` }
      : r.crew
      ? { name: r.crew, kind: "crew", url: `/crew/${urlsafe(r.crew)}` }
      : null,
  };
}

// A pool of gallery-worthy logos: resolved to an entity (so they carry a real
// caption), in ASCII collys (the stripped content_text renders cleanly as
// monospace), with content available to slice. `seed` makes the random pick
// deterministic — same seed -> same selection (used for "logo of the day").
// Defensive: [] if the catalog/columns don't exist yet.
async function galleryPool(n: number, seed: number): Promise<GalleryLogo[]> {
  try {
    const rows = await prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT c.filename AS filename, c.name AS name, cl.start_line AS start_line,
             cl.end_line AS end_line, cl.label AS label, c.content_text AS content_text,
             a.nick AS artist, a.artisturl AS artisturl, w.name AS crew
      FROM colly_logos cl
      JOIN collys c ON c.id = cl.colly_id
      LEFT JOIN artists a ON a.id = cl.artist_id
      LEFT JOIN crews w ON w.id = cl.crew_id
      WHERE (cl.artist_id IS NOT NULL OR cl.crew_id IS NOT NULL)
        AND c.content_text IS NOT NULL
        AND (c.type IS NULL OR c.type = 'ASCII')
      ORDER BY RAND(${seed})
      LIMIT ${n}
    `);
    return rows.map(shape).filter((g) => g.snippet.length > 0);
  } catch {
    return [];
  }
}

// One featured logo, stable for a given day seed.
export async function logoOfTheDay(daySeed: number): Promise<GalleryLogo | null> {
  const pool = await galleryPool(1, daySeed);
  return pool[0] ?? null;
}

// A browse grid of logos for a given seed.
export async function galleryLogos(n: number, seed: number): Promise<GalleryLogo[]> {
  return galleryPool(n, seed);
}
