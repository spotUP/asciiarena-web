import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface InactiveUser {
  id: number;
  nick: string;
  nickurl: string;
  rank: string | null;
  joined: string | null;
  lastactive: number | null;
  uploaded: number;
  comment_count: bigint | number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin")
    return apiError("Forbidden", 403);

  const years = Math.max(1, parseInt(request.nextUrl.searchParams.get("years") ?? "2") || 2);
  const cutoff = Math.floor(Date.now() / 1000) - years * 365 * 24 * 3600;

  const rows = await prisma.$queryRaw<InactiveUser[]>`
    SELECT u.id, u.nick, u.nickurl, u.rank, u.joined, u.lastactive, u.uploaded,
           (SELECT COUNT(*) FROM comments WHERE user_id = u.id) AS comment_count
    FROM users u
    WHERE (u.rank IS NULL OR u.rank NOT IN ('Admin'))
      AND (u.lastactive IS NULL OR u.lastactive < ${cutoff})
    ORDER BY u.lastactive ASC, u.id ASC
    LIMIT 500
  `;

  return apiOk(rows.map(r => ({
    id: Number(r.id),
    nick: r.nick,
    nickurl: r.nickurl,
    rank: r.rank,
    joined: r.joined,
    lastactive: r.lastactive,
    uploaded: Number(r.uploaded),
    comment_count: Number(r.comment_count),
  })));
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin")
    return apiError("Forbidden", 403);

  const body = await request.json().catch(() => ({})) as { ids?: unknown };
  if (!Array.isArray(body.ids) || body.ids.length === 0)
    return apiError("ids array required", 400);

  const ids = (body.ids as unknown[]).map(Number).filter(n => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return apiError("No valid ids", 400);

  // Never delete admins even if ids are passed
  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM users WHERE id IN (${Prisma.join(ids)}) AND (rank IS NULL OR rank NOT IN ('Admin'))`
  );

  return apiOk({ deleted: ids.length });
}
