import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface CommentRow {
  commentid: number;
  colly_id: number | null;
  filename: string | null;
  nick: string | null;
  rating: number | null;
  comment: string | null;
  timestamp: number | null;
}

// GET /api/v1/comments — latest colly comments. Optional colly_id filter.
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
  const collyId = parseInt(sp.get("colly_id") ?? "", 10);
  const whereSql = Number.isFinite(collyId) && collyId > 0 ? `WHERE c.colly_id = ?` : "";
  const params: (string | number)[] = Number.isFinite(collyId) && collyId > 0 ? [collyId] : [];

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<CommentRow[]>(
        `SELECT c.commentid, c.colly_id, c.filename, COALESCE(c.nick, u.nick, 'unknown') AS nick,
                c.rating, c.comment, c.timestamp
         FROM comments c LEFT JOIN users u ON u.id = c.user_id
         ${whereSql} ORDER BY c.commentid DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM comments c ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.commentid),
      colly_id: r.colly_id != null ? Number(r.colly_id) : null,
      filename: r.filename,
      nick: r.nick,
      rating: r.rating != null ? Number(r.rating) : null,
      timestamp: r.timestamp != null ? Number(r.timestamp) : null,
      comment: r.comment,
      html_url: r.filename ? `/release/${r.filename}` : null,
      api_url: r.colly_id != null ? `/api/v1/collys/${Number(r.colly_id)}/comments` : null,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list comments", 500);
  }
}
