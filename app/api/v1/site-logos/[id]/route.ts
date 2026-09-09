import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

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
    const row = await prisma.logos.findFirst({ where: { logo_id: id } });
    if (!row) return v1Error("Logo not found", 404);
    const ascii = row.ascii ?? "";
    return NextResponse.json(
      {
        data: {
          id: Number(row.logo_id),
          author: row.author,
          kind: row.kind,
          font: row.font,
          chars: ascii.length,
          text: ascii,
          html_url: `/logos`,
          api_url: `/api/v1/site-logos/${Number(row.logo_id)}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load logo", 500);
  }
}
