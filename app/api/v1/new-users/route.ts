import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

function joinDate(raw: unknown): string {
  const s = raw == null ? "" : String(raw);
  const ts = /^\d+$/.test(s) ? new Date(Number(s) * 1000) : new Date(s);
  return Number.isFinite(ts.getTime()) ? ts.toISOString().substring(2, 10) : "";
}

// GET /api/v1/new-users — newest members (same rows as the NEW USERS widget).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const sp = v1Params(request);
  const limit = Math.min(Math.max(1, parseInt(sp.get("limit") ?? "5", 10) || 5), 25);

  try {
    const rows = await prisma.users.findMany({
      orderBy: { joined: "desc" },
      take: limit,
      select: { id: true, nick: true, joined: true },
    });
    return NextResponse.json(
      {
        data: rows.map((u) => ({
          nick: u.nick,
          joined: joinDate(u.joined),
          html_url: `/member/${urlsafe(u.nick ?? "")}`,
        })),
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load new users", 500);
  }
}
