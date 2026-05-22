import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

interface WallPostRow {
  id: number;
  user_id: number | null;
  wall_id: number | null;
  nick: string | null;
  tag: string | null;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export async function GET(request: NextRequest) {
  const wallId = parseInt(request.nextUrl.searchParams.get("wall_id") ?? "1");
  try {
    const rows = await prisma.$queryRaw<WallPostRow[]>`
      SELECT * FROM wallposts WHERE wall_id = ${wallId}
      ORDER BY id DESC LIMIT 13
    `;
    return apiOk(rows.reverse().map((r) => ({ tag: r.tag, nick: r.nick })));
  } catch {
    return apiOk([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json() as { tagtext?: string; wall_id?: number };
  const tagtext = typeof body.tagtext === "string" ? body.tagtext.trim() : "";
  const wall_id = Number.isInteger(body.wall_id) ? (body.wall_id as number) : 1;

  if (!tagtext) return apiError("tagtext is required", 400);
  if (tagtext.length > 120) return apiError("Tag is too long (max 120 characters).", 400);

  const cleanTag = stripHtml(tagtext).slice(0, 120);
  const userId = parseInt(session.user.id);
  const nick = session.user.name ?? "";

  await prisma.$executeRaw`
    INSERT INTO wallposts (user_id, wall_id, nick, tag)
    VALUES (${userId}, ${wall_id}, ${nick}, ${cleanTag})
  `;

  const rows = await prisma.$queryRaw<WallPostRow[]>`
    SELECT * FROM wallposts WHERE wall_id = ${wall_id}
    ORDER BY id DESC LIMIT 13
  `;

  const result = rows.reverse().map((r) => ({
    tag: r.tag,
    nick: r.nick,
  }));

  return apiOk(result);
}
