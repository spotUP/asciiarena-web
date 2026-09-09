import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface PollRow {
  id: number;
  slug: string;
  title: string;
  type: string;
  status: string;
  featured: number | boolean;
  created_at: number;
}

// GET /api/v1/polls — open + closed polls (drafts excluded, like the public
// archive). ?status=open|closed, default all. Vote counts via
// /api/v1/polls/:slug.
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
  const statusRaw = (sp.get("status") ?? "").toLowerCase();
  const status = statusRaw === "open" || statusRaw === "closed" ? statusRaw : null;

  const where: string[] = [`status != 'draft'`];
  const params: (string | number)[] = [];
  if (status) { where.push(`status = ?`); params.push(status); }
  if (q) { where.push(`(title LIKE ? OR slug LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<PollRow[]>(
        `SELECT id, slug, title, type, status, featured, created_at FROM polls ${whereSql} ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM polls ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.id),
      slug: r.slug,
      title: r.title,
      type: r.type,
      status: r.status,
      featured: Number(r.featured) === 1,
      created_at: Number(r.created_at),
      html_url: `/polls/${r.slug}`,
      api_url: `/api/v1/polls/${r.slug}`,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list polls", 500);
  }
}
