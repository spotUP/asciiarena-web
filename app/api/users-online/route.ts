import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const cutoff = Math.floor(Date.now() / 1000) - 300;
  const [activeUsers, anonResult] = await Promise.all([
    prisma.users.findMany({
      where: { lastactive: { gt: cutoff } },
      orderBy: { lastactive: "desc" },
      select: { id: true, nick: true },
    }),
    prisma.$queryRaw<[{ cnt: bigint }]>(
      Prisma.sql`SELECT COUNT(DISTINCT session) AS cnt FROM users_online WHERE timestamp > ${cutoff}`
    ),
  ]);
  return NextResponse.json({
    activeUsers: activeUsers.map(u => ({ id: u.id, nick: u.nick ?? "" })),
    anonymousOnline: Number(anonResult[0]?.cnt ?? 0),
  });
}
