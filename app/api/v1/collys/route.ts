import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { safeSort, urlsafe } from "@/lib/utils";
import {
  v1Params,
  parsePagination,
  parseQuery,
  parseSort,
  v1Ok,
  v1Error,
} from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

const SORT_COLS = new Set(["name", "filename", "date", "filesize", "rating", "views", "downloads"]);

interface CollyListRow {
  id: number;
  name: string | null;
  filename: string;
  type: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  filesize: number | null;
  rating: number | null;
  views: number | null;
  downloads: number | null;
  artists: string | null;
  crews: string | null;
  logo_count: number | null;
}

function orderColumn(sort: string): string {
  switch (sort) {
    case "filename": return "c.filename";
    case "date": return "c.year, c.month, c.day";
    case "filesize": return "c.filesize";
    case "rating": return "c.rating";
    case "views": return "c.view_counter";
    case "downloads": return "c.downloads";
    default: return "c.name";
  }
}

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
  const { sort: sortRaw, order } = parseSort(sp, "name");
  const sort = safeSort(sortRaw, SORT_COLS, "name");

  const artist = (sp.get("artist") ?? "").trim().slice(0, 60);
  const crew = (sp.get("crew") ?? "").trim().slice(0, 60);
  const yearRaw = parseInt(sp.get("year") ?? "", 10);
  const year = Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : null;
  const type = (sp.get("type") ?? "").trim().toUpperCase().slice(0, 11);

  const orderCol = Prisma.raw(`${orderColumn(sort)} ${order}`);

  try {
    const like = q ? `%${q}%` : null;
    const artistLike = artist ? `%${artist}%` : null;
    const crewLike = crew ? `%${crew}%` : null;

    const whereParts: string[] = [];
    if (like) whereParts.push("(c.name LIKE ? OR c.filename LIKE ?)");
    if (artistLike) whereParts.push("EXISTS (SELECT 1 FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = c.id AND a.nick LIKE ?)");
    if (crewLike) whereParts.push("EXISTS (SELECT 1 FROM collys_crews cc JOIN crews w ON w.id = cc.crew_id WHERE cc.colly_id = c.id AND w.name LIKE ?)");
    if (year !== null) whereParts.push("c.year = ?");
    if (type) whereParts.push("c.type = ?");
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    // NOTE: $queryRaw with Prisma.sql templating keeps params escaped; the
    // ORDER BY fragment is whitelisted above, LIMIT/OFFSET are clamped ints.
    const params: (string | number)[] = [];
    if (like) params.push(like, like);
    if (artistLike) params.push(artistLike);
    if (crewLike) params.push(crewLike);
    if (year !== null) params.push(year);
    if (type) params.push(type);

    const buildQuery = (selectSql: string, withLimit: boolean) => {
      let sql = `SELECT ${selectSql} FROM collys c ${whereSql}`;
      if (withLimit) sql += ` ORDER BY ${orderColumn(sort)} ${order} LIMIT ${perPage} OFFSET ${offset}`;
      return sql;
    };

    // Prisma.$queryRawUnsafe keeps dynamic WHERE simple; all values are bound params.
    const dataSql = buildQuery(
      `c.id, c.name, c.filename, c.type, c.year, c.month, c.day, c.filesize, c.rating,
       c.view_counter AS views, c.downloads,
       (SELECT GROUP_CONCAT(a.nick ORDER BY a.nick SEPARATOR ',') FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = c.id) AS artists,
       (SELECT GROUP_CONCAT(w.name ORDER BY w.name SEPARATOR ',') FROM collys_crews cc JOIN crews w ON w.id = cc.crew_id WHERE cc.colly_id = c.id) AS crews,
       (SELECT COUNT(*) FROM colly_logos cl WHERE cl.colly_id = c.id) AS logo_count`,
      true,
    );
    const countSql = buildQuery(`COUNT(*) AS cnt`, false);

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<CollyListRow[]>(dataSql, ...params),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(countSql, ...params),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);

    const data = rows.map((r) => {
      const id = Number(r.id);
      const artists = r.artists ? String(r.artists).split(",") : [];
      const crews = r.crews ? String(r.crews).split(",") : [];
      return {
        id,
        name: r.name,
        filename: r.filename,
        type: r.type,
        year: r.year != null ? Number(r.year) : null,
        month: r.month != null ? Number(r.month) : null,
        day: r.day != null ? Number(r.day) : null,
        filesize: r.filesize != null ? Number(r.filesize) : null,
        rating: r.rating != null ? Number(r.rating) : null,
        views: r.views != null ? Number(r.views) : 0,
        downloads: r.downloads != null ? Number(r.downloads) : 0,
        logo_count: r.logo_count != null ? Number(r.logo_count) : 0,
        artists,
        crews,
        html_url: `/release/${r.filename}`,
        api_url: `/api/v1/collys/${id}`,
        logos_url: `/api/v1/collys/${id}/logos`,
        text_url: `/api/v1/collys/${id}/text`,
      };
    });

    void orderCol;
    void urlsafe;
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list collys", 500);
  }
}
