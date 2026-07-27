import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { Prisma } from "@/lib/generated/prisma/client";
import { ensureCrewId } from "@/lib/ensureEntity";
import { csvRenameSql } from "@/lib/entityRename";

const patchSchema = z.object({
  id: z.number().int().positive(),
  // Every column here is nullable in the DB and the editor echoes the row's
  // current values back, so the contract has to accept null (see
  // lib/adminCollyPatch.ts for the same lesson learnt the hard way).
  nick: z.string().trim().min(1).max(60).nullable().optional(),
  acronym: z.string().max(16).nullable().optional(),
  active: z.string().max(16).nullable().optional(),
  country: z.string().max(60).nullable().optional(),
  www: z.string().max(60).nullable().optional(),
  // Crew affiliations (member_of). When present, replaces this artist's
  // memberships wholesale — an empty array clears them.
  crewNames: z.array(z.string().trim().min(1).max(60)).optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  // ?q=* returns all artists for dropdown pickers
  if (q === "*") {
    const rows = await prisma.$queryRaw<{ id: number; nick: string }[]>`
      SELECT id, nick FROM artists ORDER BY nick ASC
    `;
    return apiOk(rows);
  }
  if (!q) return apiOk([]);

  const like = `%${q}%`;
  const rows = await prisma.$queryRaw<{ id: number; nick: string; artisturl: string; acronym: string | null; active: string | null; country: string | null; www: string | null; crews: string | null }[]>`
    SELECT a.id, a.nick, a.artisturl, a.acronym, a.active, a.country, a.www,
           COALESCE((SELECT GROUP_CONCAT(m.crew ORDER BY m.crew SEPARATOR ', ')
                     FROM member_of m WHERE m.nick = a.nick), '') AS crews
    FROM artists a
    WHERE a.nick LIKE ${like} ORDER BY a.nick ASC LIMIT 30
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

  const current = await prisma.$queryRaw<{ nick: string }[]>`
    SELECT nick FROM artists WHERE id = ${body.id}
  `;
  if (!current[0]) return apiError("Not found", 404);
  const oldNick = current[0].nick;
  const newNick = body.nick?.trim() || oldNick;
  const renamed = newNick !== oldNick;

  if (renamed) {
    const clash = await prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM artists WHERE nick = ${newNick} AND id <> ${body.id}
    `;
    if (Number(clash[0]?.cnt ?? 0) > 0) return apiError(`An artist named '${newNick}' already exists`, 409);
  }

  await prisma.$executeRaw`
    UPDATE artists SET
      nick = ${newNick},
      artisturl = ${urlsafe(newNick)},
      acronym = COALESCE(${body.acronym ?? null}, acronym),
      active = COALESCE(${body.active ?? null}, active),
      country = COALESCE(${body.country ?? null}, country),
      www = COALESCE(${body.www ?? null}, www)
    WHERE id = ${body.id}
  `;

  // Carry the old handle along in the two tables that key on the name text
  // instead of the artist id, or the rename orphans them (see lib/entityRename).
  if (renamed) {
    await prisma.$executeRaw`UPDATE member_of SET nick = ${newNick} WHERE nick = ${oldNick}`;
    await prisma.$executeRaw`
      UPDATE comments SET artist = ${csvRenameSql(Prisma.sql`artist`, oldNick, newNick)}
      WHERE FIND_IN_SET(${oldNick}, artist)
    `;
  }

  // Crew affiliations live in member_of, keyed by crew NAME. Replace the set
  // wholesale so removing a crew in the editor actually removes it, and make
  // sure each named crew exists as a real row first.
  if (body.crewNames) {
    await prisma.$executeRaw`DELETE FROM member_of WHERE nick = ${newNick}`;
    for (const crewName of body.crewNames) {
      await ensureCrewId(crewName);
      await prisma.$executeRaw`INSERT INTO member_of (crew, nick) VALUES (${crewName}, ${newNick})`;
    }
  }

  broadcast("site:artists", { type: "updated", id: body.id, nick: newNick });
  return apiOk({ status: true, nick: newNick, artisturl: urlsafe(newNick) });
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
