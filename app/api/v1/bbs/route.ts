import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface BbsRow {
  id: number;
  name: string | null;
  sysop: string | null;
  country: string | null;
  online: number | null;
  software: string | null;
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
  const whereSql = q ? `WHERE name LIKE ? OR sysop LIKE ?` : "";
  const params: (string | number)[] = q ? [`%${q}%`, `%${q}%`] : [];

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<BbsRow[]>(
        `SELECT id, name, sysop, country, online, software FROM bbses ${whereSql} ORDER BY name ASC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM bbses ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      sysop: r.sysop,
      country: r.country,
      online: Number(r.online) === 1,
      software: r.software,
      html_url: `/bbs/${Number(r.id)}`,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list bbses", 500);
  }
}
