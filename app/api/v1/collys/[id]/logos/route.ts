import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error, sliceLogoText } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface LogoRow {
  id: number;
  colly_id: number;
  position: number;
  start_line: number;
  end_line: number | null;
  manual: number;
  label: string;
  artist_id: number | null;
  crew_id: number | null;
  user_id: number | null;
  artist_nick: string | null;
  crew_name: string | null;
  filename: string;
  colly_name: string | null;
  content_text: string | null;
}

async function resolveCollyId(raw: string): Promise<number | null> {
  let id = raw;
  try { id = decodeURIComponent(raw); } catch { /* keep */ }
  if (/^\d+$/.test(id)) {
    const row = await prisma.collys.findFirst({ where: { id: Number(id) }, select: { id: true } });
    return row ? Number(row.id) : null;
  }
  const row = await prisma.collys.findFirst({ where: { filename: id }, select: { id: true } });
  return row ? Number(row.id) : null;
}

// GET /api/v1/collys/:id/logos — every tagged logo inside one colly,
// each with its ASCII text slice + deep links. This is the chatbot endpoint
// for "give me all individual logos in this release".
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const { id: raw } = await params;
  const collyId = await resolveCollyId(raw);
  if (collyId === null) return v1Error("Colly not found", 404);

  try {
    const rows = await prisma.$queryRaw<LogoRow[]>`
      SELECT cl.id, cl.colly_id, cl.position, cl.start_line, cl.end_line, cl.manual, cl.label,
             cl.artist_id, cl.crew_id, cl.user_id,
             a.nick AS artist_nick, w.name AS crew_name,
             c.filename AS filename, c.name AS colly_name, c.content_text AS content_text
      FROM colly_logos cl
      JOIN collys c ON c.id = cl.colly_id
      LEFT JOIN artists a ON a.id = cl.artist_id
      LEFT JOIN crews w ON w.id = cl.crew_id
      WHERE cl.colly_id = ${collyId}
      ORDER BY cl.position ASC
    `;

    const data = rows.map((r) => {
      const lines = sliceLogoText(r.content_text ?? "", Number(r.start_line), r.end_line != null ? Number(r.end_line) : null);
      return {
        id: Number(r.id),
        colly_id: Number(r.colly_id),
        filename: r.filename,
        colly_name: r.colly_name,
        position: Number(r.position),
        label: r.label,
        artist: r.artist_nick ?? null,
        artist_id: r.artist_id != null ? Number(r.artist_id) : null,
        crew: r.crew_name ?? null,
        crew_id: r.crew_id != null ? Number(r.crew_id) : null,
        manual: Number(r.manual) === 1,
        start_line: Number(r.start_line),
        end_line: r.end_line != null ? Number(r.end_line) : null,
        line_count: lines.length,
        text: lines.join("\n"),
        html_url: `/release/${r.filename}#logo-${Number(r.position)}`,
        api_url: `/api/v1/logos/${Number(r.id)}`,
      };
    });

    return NextResponse.json(
      { data, meta: { colly_id: collyId, total: data.length } },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load colly logos", 500);
  }
}
