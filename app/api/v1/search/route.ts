import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { urlsafe } from "@/lib/utils";

// GET /api/v1/search?q=... — one call for chatbots: top hits across collys,
// tagged logos, artists and crews. Small fixed limits; use the dedicated
// endpoints for paging through full result sets.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const sp = v1Params(request);
  const q = ((sp.get("q") ?? sp.get("filter") ?? sp.get("query") ?? "").trim()).slice(0, 200);
  if (q.length < 2) return v1Error("Query too short (min 2 chars)", 400);
  const like = `%${q}%`;

  try {
    const [collys, artists, crews, logos] = await Promise.all([
      prisma.collys.findMany({
        where: { OR: [{ name: { contains: q } }, { filename: { contains: q } }] },
        select: { id: true, filename: true, name: true },
        take: 10,
        orderBy: { name: "asc" },
      }),
      prisma.artists.findMany({
        where: { nick: { contains: q } },
        select: { id: true, nick: true },
        take: 10,
        orderBy: { nick: "asc" },
      }),
      prisma.crews.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true },
        take: 10,
        orderBy: { name: "asc" },
      }),
      prisma.$queryRaw<{ id: number; label: string; filename: string; colly_id: number; position: number }[]>`
        SELECT cl.id, cl.label, c.filename, cl.colly_id, cl.position
        FROM colly_logos cl JOIN collys c ON c.id = cl.colly_id
        WHERE cl.label LIKE ${like}
        ORDER BY cl.id DESC LIMIT 10
      `,
    ]);

    return NextResponse.json(
      {
        data: {
          query: q,
          collys: collys.map((c) => ({
            id: Number(c.id),
            name: c.name,
            filename: c.filename,
            html_url: `/release/${c.filename}`,
            api_url: `/api/v1/collys/${Number(c.id)}`,
          })),
          logos: logos.map((l) => ({
            id: Number(l.id),
            label: l.label,
            filename: l.filename,
            html_url: `/release/${l.filename}#logo-${Number(l.position)}`,
            api_url: `/api/v1/logos/${Number(l.id)}`,
          })),
          artists: artists.map((a) => ({
            id: Number(a.id),
            nick: a.nick,
            html_url: `/artist/${urlsafe(a.nick)}`,
            api_url: `/api/v1/artists/${Number(a.id)}`,
          })),
          crews: crews.map((c) => ({
            id: Number(c.id),
            name: c.name,
            html_url: `/crew/${urlsafe(c.name ?? "")}`,
            api_url: `/api/v1/crews/${Number(c.id)}`,
          })),
        },
      },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Search failed", 500);
  }
}
