import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { v1Params, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { buildTopTaggersQuery } from "@/lib/topTaggersQuery";
import { urlsafe } from "@/lib/utils";

// GET /api/v1/tops — every leaderboard widget in one call for bots:
// top uploaders, top commenters, top taggers. Same queries + ordering as the
// sidebar widgets. `limit` default 5, max 25.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, {
      status: 429,
      headers: { "Retry-After": String(rl.resetAfter), ...v1RateHeaders(0) },
    });
  }
  const sp = v1Params(request);
  const limit = Math.min(Math.max(1, parseInt(sp.get("limit") ?? "5", 10) || 5), 25);

  try {
    const [uploaders, commenters, taggers] = await Promise.all([
      prisma.users.findMany({
        where: { uploaded: { gt: 0 } },
        orderBy: { uploaded: "desc" },
        take: limit,
        select: { id: true, nick: true, uploaded: true },
      }),
      prisma.$queryRaw<{ topcommentators: bigint; nick: string; user_id: number }[]>(
        Prisma.sql`
          SELECT COUNT(user_id) AS topcommentators, nick, user_id
          FROM comments
          GROUP BY user_id, nick
          ORDER BY topcommentators DESC
          LIMIT ${limit}
        `,
      ),
      prisma.$queryRaw<{ user_id: number; nick: string; logos: bigint; collys: bigint }[]>(
        buildTopTaggersQuery(limit),
      ),
    ]);

    return NextResponse.json(
      {
        data: {
          top_uploaders: uploaders.map((u) => ({
            nick: u.nick,
            uploaded_bytes: Number(u.uploaded ?? 0),
            html_url: `/member/${urlsafe(u.nick ?? "")}`,
          })),
          top_commenters: commenters.map((c) => ({
            nick: c.nick,
            comments: Number(c.topcommentators),
            html_url: `/member/${urlsafe(c.nick ?? "")}`,
          })),
          top_taggers: taggers.map((t) => ({
            nick: t.nick,
            logos: Number(t.logos),
            collys: Number(t.collys),
            html_url: `/member/${urlsafe(t.nick ?? "")}`,
          })),
        },
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load leaderboards", 500);
  }
}
