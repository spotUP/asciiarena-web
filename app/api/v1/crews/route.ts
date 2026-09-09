import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, parseSort, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

interface CrewRow {
  id: number;
  name: string;
  acronym: string | null;
  rating: number | null;
  members_cnt: number | null;
  releases_cnt: number | null;
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
  const { sort: sortRaw, order } = parseSort(sp, "name");
  const sort = sortRaw === "rating" ? "rating" : "name";
  const orderSql = sort === "rating" ? "c.rating DESC" : `c.name ${order}`;
  const whereSql = q ? `WHERE c.name LIKE ?` : "";
  const params: (string | number)[] = q ? [`%${q}%`] : [];

  try {
    const selectCols = `c.id, c.name, c.acronym, c.rating,
      (SELECT COUNT(DISTINCT mo.nick) FROM member_of mo WHERE mo.crew = c.name) AS members_cnt,
      (SELECT COUNT(*) FROM collys_crews cc WHERE cc.crew_id = c.id) AS releases_cnt,
      (SELECT COUNT(*) FROM colly_logos cl WHERE cl.crew_id = c.id) AS logo_count`;
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<CrewRow[]>(
        `SELECT ${selectCols} FROM crews c ${whereSql} ORDER BY ${orderSql} LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM crews c ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => {
      const id = Number(r.id);
      return {
        id,
        name: r.name,
        acronym: r.acronym,
        rating: r.rating != null ? Number(r.rating) : null,
        member_count: r.members_cnt != null ? Number(r.members_cnt) : 0,
        release_count: r.releases_cnt != null ? Number(r.releases_cnt) : 0,
        logo_count: r.logo_count != null ? Number(r.logo_count) : 0,
        html_url: `/crew/${urlsafe(r.name ?? "")}`,
        api_url: `/api/v1/crews/${id}`,
        logos_url: `/api/v1/logos?crew_id=${id}`,
      };
    });
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list crews", 500);
  }
}
