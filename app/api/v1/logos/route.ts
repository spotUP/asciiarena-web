import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  v1Params,
  parsePagination,
  parseQuery,
  v1Ok,
  v1Error,
  sliceLogoText,
} from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface LogoRow {
  id: number;
  colly_id: number;
  position: number;
  start_line: number;
  end_line: number | null;
  manual: number;
  label: string;
  artist_id: number | null;
  crew_id: number | null;
  artist_nick: string | null;
  crew_name: string | null;
  filename: string;
  colly_name: string | null;
  content_text: string | null;
}

// GET /api/v1/logos — search individual tagged logos across ALL collys.
// Filters: q (label), artist (nick), crew (name), filename/colly,
// artist_id, crew_id, colly_id, manual (true|false, default all).
// This is the "all logos by artist X" endpoint.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, {
      status: 429,
      headers: { "Retry-After": String(rl.resetAfter), ...v1RateHeaders(0) },
    });
  }
  const sp = v1Params(request);
  const { page, perPage, offset } = parsePagination(sp);
  const q = parseQuery(sp);
  const artist = (sp.get("artist") ?? "").trim().slice(0, 60);
  const crew = (sp.get("crew") ?? "").trim().slice(0, 60);
  const filename = (sp.get("filename") ?? sp.get("colly") ?? "").trim().slice(0, 60);
  const artistId = parseInt(sp.get("artist_id") ?? "", 10);
  const crewId = parseInt(sp.get("crew_id") ?? "", 10);
  const collyId = parseInt(sp.get("colly_id") ?? "", 10);
  const manualRaw = (sp.get("manual") ?? "").toLowerCase();

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q) { where.push(`(cl.label LIKE ?)`); params.push(`%${q}%`); }
  if (artist) { where.push(`(a.nick LIKE ?)`); params.push(`%${artist}%`); }
  if (crew) { where.push(`(w.name LIKE ?)`); params.push(`%${crew}%`); }
  if (filename) { where.push(`(c.filename LIKE ? OR c.name LIKE ?)`); params.push(`%${filename}%`, `%${filename}%`); }
  if (Number.isFinite(artistId) && artistId > 0) { where.push(`cl.artist_id = ?`); params.push(artistId); }
  if (Number.isFinite(crewId) && crewId > 0) { where.push(`cl.crew_id = ?`); params.push(crewId); }
  if (Number.isFinite(collyId) && collyId > 0) { where.push(`cl.colly_id = ?`); params.push(collyId); }
  if (manualRaw === "true" || manualRaw === "1") { where.push(`cl.manual = 1`); }
  else if (manualRaw === "false" || manualRaw === "0") { where.push(`cl.manual = 0`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const selectCols = `cl.id, cl.colly_id, cl.position, cl.start_line, cl.end_line, cl.manual, cl.label,
      cl.artist_id, cl.crew_id, a.nick AS artist_nick, w.name AS crew_name,
      c.filename AS filename, c.name AS colly_name, c.content_text AS content_text`;
    const fromSql = `FROM colly_logos cl JOIN collys c ON c.id = cl.colly_id
      LEFT JOIN artists a ON a.id = cl.artist_id LEFT JOIN crews w ON w.id = cl.crew_id`;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<LogoRow[]>(
        `SELECT ${selectCols} ${fromSql} ${whereSql} ORDER BY cl.id DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt ${fromSql} ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);

    const data = rows.map((r) => {
      const lines = sliceLogoText(r.content_text ?? "", Number(r.start_line), r.end_line != null ? Number(r.end_line) : null);
      return {
        id: Number(r.id),
        label: r.label,
        artist: r.artist_nick ?? null,
        artist_id: r.artist_id != null ? Number(r.artist_id) : null,
        crew: r.crew_name ?? null,
        crew_id: r.crew_id != null ? Number(r.crew_id) : null,
        manual: Number(r.manual) === 1,
        colly_id: Number(r.colly_id),
        filename: r.filename,
        colly_name: r.colly_name,
        position: Number(r.position),
        start_line: Number(r.start_line),
        end_line: r.end_line != null ? Number(r.end_line) : null,
        line_count: lines.length,
        text: lines.join("\n"),
        html_url: `/release/${r.filename}#logo-${Number(r.position)}`,
        api_url: `/api/v1/logos/${Number(r.id)}`,
      };
    });

    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to search logos", 500);
  }
}
