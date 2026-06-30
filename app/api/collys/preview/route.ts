import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { parseCollyBytes, sectionsFromLogoMap, type CollyMeta } from "@/lib/collyTrailer";
import { detectLogoSections, buildLogoIndex, type LogoSection } from "@/lib/logoSections";
import { buildLogoRows, buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { parseCollyIndex } from "@/lib/collyIndex";
import { loadEntityDicts } from "@/lib/collyLogoIndex";
import { cleanLabel, type EntityDicts } from "@/lib/handleMatch";
import {
  decodeReleaseText, decodeLatin1Bytes, stripFileIdDiz, releaseTextEncoding, looksLikeCp437Art, hasAnsiCodes,
} from "@/lib/releaseText";

export const dynamic = "force-dynamic";

// Dry-run: parse an uploaded colly EXACTLY as the site would, and report what we
// read — detected/mapped logos, index, trailer settings, and warnings — without
// storing anything. Powers the interactive tester so artists tune before publishing.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return apiError("No file", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { visible, meta } = parseCollyBytes(bytes);

  const name = file.name.toLowerCase();
  const ext = name.split(".").pop() ?? "";
  // Detect by CONTENT, not just extension — an ANSI colly saved as .txt still has
  // ESC[ codes and should render as ANSI.
  const type = ["dms", "lzh", "lha", "zip"].includes(ext) ? "ARCHIVE"
    : ext === "ans" || hasAnsiCodes(decodeLatin1Bytes(visible)) ? "ANSI"
    : looksLikeCp437Art(visible) ? "CP437" : "ASCII";
  const encoding = releaseTextEncoding(type === "CP437" ? "CP437" : null, null);
  // Raw decoded text (not HTML-escaped) so the tester renders it 1:1 and line
  // numbers line up with the logo map.
  const raw = decodeReleaseText(visible, encoding).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const text = stripFileIdDiz(raw).content;
  const lineCount = text.split("\n").length;

  let dicts: EntityDicts = { artists: [], crews: [], users: [] };
  try { dicts = await loadEntityDicts(); } catch { /* catalog may be empty */ }

  const tagged = !!(meta.logos && meta.logos.length);
  const sections: LogoSection[] = tagged
    ? sectionsFromLogoMap(meta.logos!, lineCount)
    : detectLogoSections(text);
  const rows = tagged ? buildLogoRowsFromMap(0, meta.logos!, dicts) : buildLogoRows(0, text, dicts);

  // One report row per detected/mapped logo.
  const logos = (tagged
    ? meta.logos!.slice().sort((a, b) => a.line - b.line).map((m) => ({ line: m.line, label: m.caption }))
    : buildLogoIndex(text, sections).map((e) => ({ line: e.section.startLine + 1, label: e.label }))
  ).map((lg) => {
    const row = rows.find((r) => cleanLabel(r.label).toLowerCase() === cleanLabel(lg.label).toLowerCase());
    return {
      line: lg.line,
      name: cleanLabel(lg.label),
      resolved: row ? (row.artist_id ? "artist" : row.crew_id ? "crew" : row.user_id ? "member" : null) : null,
      searchable: !!row,
    };
  });

  const index = parseCollyIndex(text);

  const warnings: string[] = [];
  if (!tagged && sections.length === 0) warnings.push("No logos detected. Caption each logo (a name line in the gap above it) or add a logo map.");
  const uncaptioned = logos.filter((l) => /^Logo \d+$/.test(l.name)).length;
  if (uncaptioned) warnings.push(`${uncaptioned} logo(s) have no caption — they won't be searchable. Add a name line above each, or tag them.`);
  if (sections.length > 1 && index.length === 0 && !tagged) warnings.push("No clickable index detected. An 'o1> NAME  o2> NAME' table becomes jump links.");
  if (meta.soundtrack && !/^[^/]+\/[^/]+\/.+/.test(meta.soundtrack)) warnings.push(`Soundtrack "${meta.soundtrack}" doesn't look like a Modland path (Format/Author/File).`);

  const report: {
    type: string; encoding: string; lineCount: number; tagged: boolean; text: string;
    meta: CollyMeta; logos: typeof logos; index: typeof index; warnings: string[];
  } = { type, encoding, lineCount, tagged, text, meta, logos, index, warnings };

  return apiOk(report);
}
