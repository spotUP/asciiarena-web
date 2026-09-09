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
    const row = await prisma.news.findFirst({ where: { id, published: true } });
    if (!row) return v1Error("News item not found", 404);
    return NextResponse.json(
      {
        data: {
          id: Number(row.id),
          title: row.title,
          body: row.body,
          created_at: Number(row.created_at),
          updated_at: Number(row.updated_at),
          html_url: `/news`,
          api_url: `/api/v1/news/${Number(row.id)}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load news item", 500);
  }
}
