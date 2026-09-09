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
    const artist = /^\d+$/.test(id)
      ? await prisma.artists.findFirst({ where: { id: Number(id) } })
      : await prisma.artists.findFirst({ where: { nick: id } });
    if (!artist) return v1Error("Artist not found", 404);
    const aid = Number(artist.id);

    const [crews, collys, logoCount] = await Promise.all([
      prisma.$queryRaw<{ crew: string }[]>`SELECT crew FROM member_of WHERE nick = ${artist.nick} ORDER BY crew ASC`,
      prisma.$queryRaw<{ id: number; name: string | null; filename: string }[]>`
        SELECT c.id, c.name, c.filename FROM collys c
        JOIN artists_collys ac ON ac.colly_id = c.id
        WHERE ac.artist_id = ${aid} ORDER BY c.year DESC, c.month DESC, c.day DESC LIMIT 50`,
      prisma.colly_logos.count({ where: { artist_id: aid } }),
    ]);

    return NextResponse.json(
      {
        data: {
          id: aid,
          nick: artist.nick,
          country: artist.country,
          www: artist.www,
          rating: artist.rating != null ? Number(artist.rating) : null,
          crews: crews.map((c) => c.crew),
          collys: collys.map((c) => ({
            id: Number(c.id),
            name: c.name,
            filename: c.filename,
            html_url: `/release/${c.filename}`,
            api_url: `/api/v1/collys/${Number(c.id)}`,
          })),
          logo_count: logoCount,
          html_url: `/artist/${urlsafe(artist.nick)}`,
          api_url: `/api/v1/artists/${aid}`,
          logos_url: `/api/v1/logos?artist_id=${aid}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load artist", 500);
  }
}
