import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return v1Error("Invalid id", 400);

  try {
    const rows = await prisma.$queryRaw<{ id: number; title: string; description: string | null; status: number | null; timestamp: number | null; requestedby: number; nick: string | null }[]>`
      SELECT r.id, r.title, r.description, r.status, r.timestamp, r.requestedby, u.nick AS nick
      FROM requests r LEFT JOIN users u ON u.id = r.requestedby
      WHERE r.id = ${id} LIMIT 1
    `;
    const r = rows[0];
    if (!r) return v1Error("Request not found", 404);

    const comments = await prisma.$queryRaw<{ comment_id: number; user_id: number; comment: string | null; timestamp: number; nick: string | null }[]>`
      SELECT rc.comment_id, rc.user_id, rc.comment, rc.timestamp, u.nick AS nick
      FROM request_comments rc LEFT JOIN users u ON u.id = rc.user_id
      WHERE rc.request_id = ${id} ORDER BY rc.comment_id ASC
    `;

    return NextResponse.json(
      {
        data: {
          id: Number(r.id),
          title: r.title,
          description: r.description,
          status: r.status != null ? Number(r.status) : 0,
          requested_by: r.nick,
          timestamp: r.timestamp != null ? Number(r.timestamp) : null,
          comments: comments.map((c) => ({
            id: Number(c.comment_id),
            nick: c.nick,
            timestamp: Number(c.timestamp),
            comment: c.comment,
          })),
          html_url: `/requests/${Number(r.id)}`,
          api_url: `/api/v1/requests/${Number(r.id)}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load request", 500);
  }
}
