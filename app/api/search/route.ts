import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ collys: [], artists: [], crews: [] });

  const [collys, artists, crews] = await Promise.all([
    prisma.collys.findMany({
      where: { OR: [{ name: { contains: q } }, { filename: { contains: q } }] },
      select: { filename: true, name: true },
      take: 20,
      orderBy: { name: "asc" },
    }),
    prisma.artists.findMany({
      where: { nick: { contains: q } },
      select: { nick: true, artisturl: true },
      take: 10,
      orderBy: { nick: "asc" },
    }),
    prisma.crews.findMany({
      where: { name: { contains: q } },
      select: { name: true, crewurl: true },
      take: 10,
      orderBy: { name: "asc" },
    }),
  ]);
  return NextResponse.json({ collys, artists, crews });
}
