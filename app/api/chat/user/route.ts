import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  // Lookup by nick (chat's original need) or by id — the composer arrives from
  // "send a message" links that carry a numeric id and needs the nick to show.
  const nick = request.nextUrl.searchParams.get("nick")?.trim();
  const idParam = request.nextUrl.searchParams.get("id")?.trim();

  let rows: Array<{ id: number; nick: string } | undefined>;
  if (nick) {
    rows = await prisma.$queryRaw<[{ id: number; nick: string }?]>`
      SELECT id, nick FROM users WHERE LOWER(nick) = LOWER(${nick}) LIMIT 1
    `;
  } else if (idParam && Number.isFinite(Number(idParam))) {
    rows = await prisma.$queryRaw<[{ id: number; nick: string }?]>`
      SELECT id, nick FROM users WHERE id = ${Number(idParam)} LIMIT 1
    `;
  } else {
    return apiError("nick or id required", 400);
  }

  if (!rows[0]) return apiError("User not found", 404);
  return apiOk({ id: rows[0].id, nick: rows[0].nick });
}
