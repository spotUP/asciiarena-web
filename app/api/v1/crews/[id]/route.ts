import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const { id: raw } = await params;
  let id = raw;
  try { id = decodeURIComponent(raw); } catch { /* keep */ }

  try {
    const crew = /^\d+$/.test(id)
      ? await prisma.crews.findFirst({ where: { id: Number(id) } })
      : await prisma.crews.findFirst({ where: { name: id } });
    if (!crew) return v1Error("Crew not found", 404);
    const cid = Number(crew.id);

    const [members, releases, logoCount] = await Promise.all([
      prisma.$queryRaw<{ nick: string }[]>`SELECT nick FROM member_of WHERE crew = ${crew.name} ORDER BY nick ASC LIMIT 200`,
      prisma.$queryRaw<{ id: number; name: string | null; filename: string }[]>`
        SELECT c.id, c.name, c.filename FROM collys c
        JOIN collys_crews cc ON cc.colly_id = c.id
        WHERE cc.crew_id = ${cid} ORDER BY c.year DESC, c.month DESC, c.day DESC LIMIT 50`,
      prisma.colly_logos.count({ where: { crew_id: cid } }),
    ]);

    return NextResponse.json(
      {
        data: {
          id: cid,
          name: crew.name,
          acronym: crew.acronym,
          www: crew.www,
          rating: crew.rating != null ? Number(crew.rating) : null,
          members: members.map((m) => m.nick),
          releases: releases.map((c) => ({
            id: Number(c.id),
            name: c.name,
            filename: c.filename,
            html_url: `/release/${c.filename}`,
            api_url: `/api/v1/collys/${Number(c.id)}`,
          })),
          logo_count: logoCount,
          html_url: `/crew/${urlsafe(crew.name ?? "")}`,
          api_url: `/api/v1/crews/${cid}`,
          logos_url: `/api/v1/logos?crew_id=${cid}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load crew", 500);
  }
}
