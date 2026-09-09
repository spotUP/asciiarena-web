import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

// GET /api/v1/last-callers — recently active users by heartbeat
// (same rows as the LAST CALLERS widget).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const sp = v1Params(request);
  const limit = Math.min(Math.max(1, parseInt(sp.get("limit") ?? "5", 10) || 5), 25);

  try {
    const rows = await prisma.users.findMany({
      where: { lastactive: { gt: 0 } },
      orderBy: { lastactive: "desc" },
      take: limit,
      select: { id: true, nick: true, lastactive: true },
    });
    return NextResponse.json(
      {
        data: rows.map((u) => ({
          nick: u.nick,
          last_active: u.lastactive != null ? Number(u.lastactive) : null,
          html_url: `/member/${urlsafe(u.nick ?? "")}`,
        })),
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load last callers", 500);
  }
}
