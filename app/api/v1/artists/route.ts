import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

interface ArtistRow {
  id: number;
  nick: string;
  country: string | null;
  rating: number | null;
  crews: string | null;
  colly_count: number | null;
  logo_count: number | null;
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

  const whereSql = q ? `WHERE a.nick LIKE ?` : "";
  const params: (string | number)[] = q ? [`%${q}%`] : [];

  try {
    const selectCols = `a.id, a.nick, a.country, a.rating,
      (SELECT GROUP_CONCAT(m.crew ORDER BY m.crew SEPARATOR ',') FROM member_of m WHERE m.nick = a.nick) AS crews,
      (SELECT COUNT(*) FROM artists_collys ac WHERE ac.artist_id = a.id) AS colly_count,
      (SELECT COUNT(*) FROM colly_logos cl WHERE cl.artist_id = a.id) AS logo_count`;
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<ArtistRow[]>(
        `SELECT ${selectCols} FROM artists a ${whereSql} ORDER BY a.nick ASC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM artists a ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => {
      const id = Number(r.id);
      return {
        id,
        nick: r.nick,
        country: r.country,
        rating: r.rating != null ? Number(r.rating) : null,
        crews: r.crews ? String(r.crews).split(",") : [],
        colly_count: r.colly_count != null ? Number(r.colly_count) : 0,
        logo_count: r.logo_count != null ? Number(r.logo_count) : 0,
        html_url: `/artist/${urlsafe(r.nick)}`,
        api_url: `/api/v1/artists/${id}`,
        logos_url: `/api/v1/logos?artist_id=${id}`,
      };
    });
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list artists", 500);
  }
}
