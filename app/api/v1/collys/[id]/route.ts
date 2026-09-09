import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface CollyRow {
  id: number;
  name: string | null;
  filename: string;
  type: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  filesize: number | null;
  rating: number | null;
  view_counter: number | null;
  downloads: number | null;
  uploader: string | null;
  timestamp: number | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const { id: raw } = await params;
  let id: string = raw;
  try { id = decodeURIComponent(raw); } catch { /* keep raw */ }
  const numeric = /^\d+$/.test(id) ? Number(id) : null;

  try {
    const colly: CollyRow | null = numeric !== null
      ? await prisma.collys.findFirst({ where: { id: numeric } })
      : await prisma.collys.findFirst({ where: { filename: id } });
    if (!colly) return v1Error("Colly not found", 404);

    const [artistRows, crewRows, logoCount, commentCount] = await Promise.all([
      prisma.artists_collys.findMany({
        where: { colly_id: colly.id },
        include: { artists: { select: { id: true, nick: true } } },
        orderBy: { sortorder: "asc" },
      }),
      prisma.collys_crews.findMany({
        where: { colly_id: colly.id },
        include: { crews: { select: { id: true, name: true } } },
        orderBy: { sortorder: "asc" },
      }),
      prisma.colly_logos.count({ where: { colly_id: colly.id } }),
      prisma.comments.count({ where: { colly_id: colly.id } }),
    ]);

    const cid = Number(colly.id);
    return NextResponse.json(
      {
        data: {
          id: cid,
          name: colly.name,
          filename: colly.filename,
          type: colly.type,
          year: colly.year != null ? Number(colly.year) : null,
          month: colly.month != null ? Number(colly.month) : null,
          day: colly.day != null ? Number(colly.day) : null,
          filesize: colly.filesize != null ? Number(colly.filesize) : null,
          rating: colly.rating != null ? Number(colly.rating) : null,
          views: colly.view_counter != null ? Number(colly.view_counter) : 0,
          downloads: colly.downloads != null ? Number(colly.downloads) : 0,
          uploader: colly.uploader,
          uploaded_at: colly.timestamp != null ? Number(colly.timestamp) : null,
          artists: artistRows.map((r) => r.artists ? { id: Number(r.artists.id), nick: r.artists.nick, api_url: `/api/v1/artists/${Number(r.artists.id)}` } : null).filter(Boolean),
          crews: crewRows.map((r) => r.crews ? { id: Number(r.crews.id), name: r.crews.name, api_url: `/api/v1/crews/${Number(r.crews.id)}` } : null).filter(Boolean),
          logo_count: logoCount,
          comment_count: commentCount,
          html_url: `/release/${colly.filename}`,
          api_url: `/api/v1/collys/${cid}`,
          logos_url: `/api/v1/collys/${cid}/logos`,
          comments_url: `/api/v1/collys/${cid}/comments`,
          text_url: `/api/v1/collys/${cid}/text`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load colly", 500);
  }
}
