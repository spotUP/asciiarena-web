import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface CommentRow {
  commentid: number;
  timestamp: number | null;
  nick: string | null;
  rating: number | null;
  comment: string | null;
}

async function resolveCollyId(raw: string): Promise<number | null> {
  let id = raw;
  try { id = decodeURIComponent(raw); } catch { /* keep */ }
  if (/^\d+$/.test(id)) {
    const row = await prisma.collys.findFirst({ where: { id: Number(id) }, select: { id: true } });
    return row ? Number(row.id) : null;
  }
  const row = await prisma.collys.findFirst({ where: { filename: id }, select: { id: true } });
  return row ? Number(row.id) : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const { id: raw } = await params;
  const collyId = await resolveCollyId(raw);
  if (collyId === null) return v1Error("Colly not found", 404);

  try {
    const rows = await prisma.$queryRaw<CommentRow[]>(
      Prisma.sql`SELECT c.commentid, c.timestamp,
                 COALESCE(c.nick, u.nick, 'unknown') AS nick,
                 c.rating, c.comment
                 FROM comments c
                 LEFT JOIN users u ON u.id = c.user_id
                 WHERE c.colly_id = ${collyId}
                 ORDER BY c.commentid ASC`,
    );
    const data = rows.map((r) => ({
      id: Number(r.commentid),
      colly_id: collyId,
      nick: r.nick,
      rating: r.rating != null ? Number(r.rating) : null,
      timestamp: r.timestamp != null ? Number(r.timestamp) : null,
      comment: r.comment,
    }));
    return NextResponse.json(
      { data, meta: { colly_id: collyId, total: data.length } },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load comments", 500);
  }
}
