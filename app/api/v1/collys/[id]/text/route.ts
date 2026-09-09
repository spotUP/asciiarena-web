import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { readCollyText } from "@/lib/collyText";

// GET /api/v1/collys/:id/text — decoded plaintext of the whole colly
// (same decoder as the release viewer). Bots use this to render or
// re-slice logos themselves; /logos/:id/text slices are preferred for
// single-logo reads.
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
    const colly = /^\d+$/.test(id)
      ? await prisma.collys.findFirst({ where: { id: Number(id) } })
      : await prisma.collys.findFirst({ where: { filename: id } });
    if (!colly) return v1Error("Colly not found", 404);

    const text = readCollyText(colly.filename, colly.type) ?? colly.content_text ?? "";
    const lines = text ? text.split("\n").length : 0;
    return NextResponse.json(
      {
        data: {
          id: Number(colly.id),
          filename: colly.filename,
          name: colly.name,
          type: colly.type,
          chars: text.length,
          lines,
          text,
          html_url: `/release/${colly.filename}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load colly text", 500);
  }
}
