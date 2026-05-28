import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";

const patchSchema = z.object({
  id: z.number().int().positive(),
  nick: z.string().max(100).optional(),
  active: z.string().max(10).optional(),
  country: z.string().max(100).optional(),
  www: z.string().max(500).optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


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

  const rawPatchBody = await request.json().catch(() => ({}));
  const patchParsed = patchSchema.safeParse(rawPatchBody);
  if (!patchParsed.success) return apiError("Invalid request: " + patchParsed.error.issues[0]?.message, 400);
  const body = patchParsed.data;

  await prisma.$executeRaw`
    UPDATE artists SET
      nick = COALESCE(${body.nick ?? null}, nick),
      active = COALESCE(${body.active ?? null}, active),
      country = COALESCE(${body.country ?? null}, country),
      www = COALESCE(${body.www ?? null}, www)
    WHERE id = ${body.id}
  `;
  broadcast("site:artists", { type: "updated", id: body.id });
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);
  const body = deleteParsed.data;

  const rows = await prisma.$queryRaw<{ nick: string }[]>`SELECT nick FROM artists WHERE id = ${body.id}`;
  if (!rows[0]) return apiError("Not found", 404);

  await prisma.$executeRaw`DELETE FROM member_of WHERE nick = ${rows[0].nick}`;
  await prisma.$executeRaw`DELETE FROM artists_collys WHERE artist_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM artists WHERE id = ${body.id}`;
  broadcast("site:artists", { type: "deleted", id: body.id, nick: rows[0].nick });
  return apiOk({ status: true });
}
