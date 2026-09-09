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
    const wall = await prisma.walls.findFirst({ where: { id } });
    if (!wall) return v1Error("Wall not found", 404);
    const posts = await prisma.$queryRaw<{ id: number; nick: string | null; tag: string | null }[]>`
      SELECT id, nick, tag FROM wallposts WHERE wall_id = ${id}
      ORDER BY id DESC LIMIT 13
    `;
    return NextResponse.json(
      {
        data: {
          id: Number(wall.id),
          name: wall.name,
          description: wall.description,
          posts: posts.reverse().map((p) => ({
            id: Number(p.id),
            nick: p.nick,
            tag: p.tag,
          })),
          api_url: `/api/v1/walls/${Number(wall.id)}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load wall", 500);
  }
}
