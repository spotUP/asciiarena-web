import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

// GET /api/v1/online — who is on right now (same 5-minute heartbeat window
// as the USERS ONLINE widget) plus the anonymous session count.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  try {
    const cutoff = Math.floor(Date.now() / 1000) - 300;
    const [activeUsers, anonRows] = await Promise.all([
      prisma.users.findMany({
        where: { lastactive: { gt: cutoff } },
        orderBy: { lastactive: "desc" },
        select: { id: true, nick: true, lastactive: true },
      }),
      prisma.$queryRaw<[{ online: bigint }]>(
        Prisma.sql`SELECT COUNT(DISTINCT(session)) as online FROM users_online`,
      ),
    ]);
    return NextResponse.json(
      {
        data: {
          online_users: activeUsers.map((u) => ({
            nick: u.nick,
            last_active: u.lastactive != null ? Number(u.lastactive) : null,
            html_url: `/member/${urlsafe(u.nick ?? "")}`,
          })),
          online_count: activeUsers.length,
          anonymous_count: Number(anonRows[0]?.online ?? 0),
        },
      },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load online users", 500);
  }
}
