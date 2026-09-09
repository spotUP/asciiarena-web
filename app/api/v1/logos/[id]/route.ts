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
  label_norm: string;
  artist_id: number | null;
  crew_id: number | null;
  user_id: number | null;
  artist_nick: string | null;
  crew_name: string | null;
  filename: string;
  colly_name: string | null;
  content_text: string | null;
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
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return v1Error("Invalid id", 400);

  try {
    const rows = await prisma.$queryRaw<LogoRow[]>`
      SELECT cl.id, cl.colly_id, cl.position, cl.start_line, cl.end_line, cl.manual,
             cl.label, cl.label_norm, cl.artist_id, cl.crew_id, cl.user_id,
             a.nick AS artist_nick, w.name AS crew_name,
             c.filename AS filename, c.name AS colly_name, c.content_text AS content_text
      FROM colly_logos cl
      JOIN collys c ON c.id = cl.colly_id
      LEFT JOIN artists a ON a.id = cl.artist_id
      LEFT JOIN crews w ON w.id = cl.crew_id
      WHERE cl.id = ${id}
      LIMIT 1
    `;
    const r = rows[0];
    if (!r) return v1Error("Logo not found", 404);
    const lines = sliceLogoText(r.content_text ?? "", Number(r.start_line), r.end_line != null ? Number(r.end_line) : null);
    return NextResponse.json(
      {
        data: {
          id: Number(r.id),
          label: r.label,
          artist: r.artist_nick ?? null,
          artist_id: r.artist_id != null ? Number(r.artist_id) : null,
          crew: r.crew_name ?? null,
          crew_id: r.crew_id != null ? Number(r.crew_id) : null,
          manual: Number(r.manual) === 1,
          colly_id: Number(r.colly_id),
          filename: r.filename,
          colly_name: r.colly_name,
          position: Number(r.position),
          start_line: Number(r.start_line),
          end_line: r.end_line != null ? Number(r.end_line) : null,
          line_count: lines.length,
          text: lines.join("\n"),
          lines,
          html_url: `/release/${r.filename}#logo-${Number(r.position)}`,
          api_url: `/api/v1/logos/${Number(r.id)}`,
          colly_url: `/api/v1/collys/${Number(r.colly_id)}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load logo", 500);
  }
}
