import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface NewsRow {
  id: number;
  title: string;
  created_at: number;
}

// GET /api/v1/news — published site news (same list as the NEWS sidebar
// widget). Bodies via /api/v1/news/:id.
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
  const whereSql = q ? `WHERE published = 1 AND (title LIKE ? OR body LIKE ?)` : `WHERE published = 1`;
  const params: (string | number)[] = q ? [`%${q}%`, `%${q}%`] : [];

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<NewsRow[]>(
        `SELECT id, title, created_at FROM news ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM news ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      created_at: Number(r.created_at),
      html_url: `/news`,
      api_url: `/api/v1/news/${Number(r.id)}`,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list news", 500);
  }
}
