import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";
import { parseCollyBytes, sectionsFromLogoMap, type CollyMeta } from "@/lib/collyTrailer";
import { detectLogoSections, buildLogoIndex, type LogoSection } from "@/lib/logoSections";
import { buildLogoRows, buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { parseCollyIndex } from "@/lib/collyIndex";
import { loadEntityDicts } from "@/lib/collyLogoIndex";
import { cleanLabel, type EntityDicts } from "@/lib/handleMatch";
import { decodeReleaseText, decodeLatin1Bytes, stripFileIdDiz, releaseTextEncoding, BEGIN_FILE_ID_DIZ, END_FILE_ID_DIZ } from "@/lib/releaseText";
import { detectCollyType } from "@/lib/collyType";
import { collyFilePath } from "@/lib/collyText";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

// Remove the embedded file_id.diz block at the BYTE level, so the canvas the
// editor renders matches the diz-stripped text the detector measures (otherwise
// the diz's extra rows make the canvas taller and the logo bands drift down).
function stripDizBytes(bytes: Uint8Array): Uint8Array {
  const s = decodeLatin1Bytes(bytes); // 1:1 byte<->char
  const b = s.indexOf(BEGIN_FILE_ID_DIZ); const e = s.indexOf(END_FILE_ID_DIZ);
  if (b === -1 || e === -1 || e <= b) return bytes;
  let end = e + END_FILE_ID_DIZ.length;
  if (s[end] === "\r") end++; if (s[end] === "\n") end++;
  const out = s.slice(0, b) + s.slice(end);
  return new Uint8Array([...out].map((c) => c.charCodeAt(0) & 0xff));
}

// Dry-run: parse an uploaded colly EXACTLY as the site would, and report what we
// read — detected/mapped logos, index, trailer settings, and warnings — without
// storing anything. Powers the interactive tester so artists tune before publishing.
async function buildReport(bytes: Uint8Array, filename: string) {
  const { visible, meta } = parseCollyBytes(bytes);

  const type = detectCollyType(bytes, filename);
  const encoding = releaseTextEncoding(type === "CP437" ? "CP437" : null, null);
  // Raw decoded text (not HTML-escaped) so the tester renders it 1:1 and line
  // numbers line up with the logo map.
  const raw = decodeReleaseText(visible, encoding).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Strip ANSI escape sequences so detection (and the displayed report) see the
  // characters, not "[36m" fragments. ANSI collys were leaking codes into names.
  // eslint-disable-next-line no-control-regex
  const text = stripFileIdDiz(raw).content.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "");
  const lineCount = text.split("\n").length;

  let dicts: EntityDicts = { artists: [], crews: [], users: [] };
  try { dicts = await loadEntityDicts(); } catch { /* catalog may be empty */ }
  // artist id -> full name, so a logo signed with an acronym fills in the author.
  const artistNick = new Map<number, string>();
  try { (await prisma.artists.findMany({ select: { id: true, nick: true } })).forEach((a) => { if (a.nick) artistNick.set(a.id, a.nick); }); } catch { /* ignore */ }

  const tagged = !!(meta.logos && meta.logos.length);
  const sections: LogoSection[] = tagged
    ? sectionsFromLogoMap(meta.logos!, lineCount, text)
    : detectLogoSections(text);
  const rows = tagged ? buildLogoRowsFromMap(0, meta.logos!, dicts) : buildLogoRows(0, text, dicts);

  // One report row per detected/mapped logo, with its line range (for bands).
  const logos = (tagged
    ? meta.logos!.slice().sort((a, b) => a.line - b.line).map((m, i, arr) => ({ line: m.line, end: m.end ?? (arr[i + 1] ? arr[i + 1].line - 1 : lineCount), label: m.caption }))
    : buildLogoIndex(text, sections).map((e) => ({ line: e.section.startLine + 1, end: e.section.endLine + 1, label: e.label }))
  ).map((lg) => {
    const row = rows.find((r) => cleanLabel(r.label).toLowerCase() === cleanLabel(lg.label).toLowerCase());
    return {
      line: lg.line,
      end: lg.end,
      name: cleanLabel(lg.label),
      // Logo signed with an acronym -> the matched artist's full name.
      author: row?.artist_id ? (artistNick.get(row.artist_id) ?? null) : null,
      resolved: row ? (row.artist_id ? "artist" : row.crew_id ? "crew" : row.user_id ? "member" : null) : null,
      searchable: !!row,
    };
  });

  const index = parseCollyIndex(text);

  const warnings: string[] = [];
  if (!tagged && sections.length === 0) warnings.push("No logos detected");
  const uncaptioned = logos.filter((l) => /^Logo \d+$/.test(l.name)).length;
  if (uncaptioned) warnings.push(`${uncaptioned} logo${uncaptioned === 1 ? "" : "s"} not searchable`);
  if (sections.length > 1 && index.length === 0 && !tagged) warnings.push("No clickable index detected");
  if (meta.soundtrack && !/^[^/]+\/[^/]+\/.+/.test(meta.soundtrack)) warnings.push("Soundtrack path looks wrong");

  // Canvas art = the diz-stripped visible bytes, so it lines up with `text`.
  const artB64 = type === "ANSI" || type === "CP437" ? Buffer.from(stripDizBytes(visible)).toString("base64") : null;

  const report: {
    type: string; encoding: string; lineCount: number; tagged: boolean; text: string; artB64: string | null;
    meta: CollyMeta; logos: typeof logos; index: typeof index; warnings: string[];
  } = { type, encoding, lineCount, tagged, text, artB64, meta, logos, index, warnings };

  return report;
}

// Dry-run an UPLOADED file (submit flow): parse exactly as the site would and
// report what we read, without storing anything.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return apiError("No file", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  return apiOk(await buildReport(bytes, file.name));
}

// Same report for an EXISTING colly on disk (admin colly editor re-mapping).
// Any logged-in user: this is a read-only dry run of a colly that is already
// publicly downloadable, and the public logo tagger needs the same report the
// admin editor does. Nothing it returns is privileged.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const filename = request.nextUrl.searchParams.get("filename")?.trim();
  if (!filename) return apiError("No filename", 400);
  const path = collyFilePath(filename);
  if (!path) return apiError("Not found", 404);
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await readFile(path)); } catch { return apiError("Not found", 404); }
  return apiOk(await buildReport(bytes, filename));
}
