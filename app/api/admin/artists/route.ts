import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";


export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q) return apiOk([]);

  const like = `%${q}%`;
  const rows = await prisma.$queryRaw<{ id: number; nick: string; artisturl: string; active: string | null; country: string | null; www: string | null }[]>`
    SELECT id, nick, artisturl, active, country, www FROM artists
    WHERE nick LIKE ${like} ORDER BY nick ASC LIMIT 30
  `;
  return apiOk(rows);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number; nick?: string; active?: string; country?: string; www?: string };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`
    UPDATE artists SET
      nick = COALESCE(${body.nick ?? null}, nick),
      active = COALESCE(${body.active ?? null}, active),
      country = COALESCE(${body.country ?? null}, country),
      www = COALESCE(${body.www ?? null}, www)
    WHERE id = ${body.id}
  `;
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number };
  if (!body.id) return apiError("id required", 400);

  const rows = await prisma.$queryRaw<{ nick: string }[]>`SELECT nick FROM artists WHERE id = ${body.id}`;
  if (!rows[0]) return apiError("Not found", 404);

  await prisma.$executeRaw`DELETE FROM member_of WHERE nick = ${rows[0].nick}`;
  await prisma.$executeRaw`DELETE FROM artists_collys WHERE artist_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM artists WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
