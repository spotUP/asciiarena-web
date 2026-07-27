import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { Prisma } from "@/lib/generated/prisma/client";
import { csvRenameSql } from "@/lib/entityRename";

// Limits mirror the column widths in prisma/schema.prisma, and every field the
// editor echoes back accepts null (nullable column -> nullable contract).
const patchSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(60).nullable().optional(),
  active: z.string().max(16).nullable().optional(),
  www: z.string().max(60).nullable().optional(),
  acronym: z.string().max(12).nullable().optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  // ?q=* returns all crews for dropdown pickers
  if (q === "*") {
    const rows = await prisma.$queryRaw<{ id: number; name: string }[]>`
      SELECT id, name FROM crews ORDER BY name ASC
    `;
    return apiOk(rows);
  }
  if (!q) return apiOk([]);

  const like = `%${q}%`;
  const rows = await prisma.$queryRaw<{ id: number; name: string; crewurl: string; active: string | null; www: string | null; acronym: string | null }[]>`
    SELECT id, name, crewurl, active, www, acronym FROM crews
    WHERE name LIKE ${like} ORDER BY name ASC LIMIT 30
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

  const current = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM crews WHERE id = ${body.id}
  `;
  if (!current[0]) return apiError("Not found", 404);
  const oldName = current[0].name;
  const newName = body.name?.trim() || oldName;
  const renamed = newName !== oldName;

  if (renamed) {
    const clash = await prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM crews WHERE name = ${newName} AND id <> ${body.id}
    `;
    if (Number(clash[0]?.cnt ?? 0) > 0) return apiError(`A crew named '${newName}' already exists`, 409);
  }

  await prisma.$executeRaw`
    UPDATE crews SET
      name = ${newName},
      crewurl = ${urlsafe(newName)},
      active = COALESCE(${body.active ?? null}, active),
      www = COALESCE(${body.www ?? null}, www),
      acronym = COALESCE(${body.acronym ?? null}, acronym)
    WHERE id = ${body.id}
  `;

  // collys_crews joins on crew_id and looks after itself, but memberships, BBS
  // affiliations and the denormalized comment column all key on the crew NAME
  // and would orphan on a rename (see lib/entityRename).
  if (renamed) {
    await prisma.$executeRaw`UPDATE member_of SET crew = ${newName} WHERE crew = ${oldName}`;
    await prisma.$executeRaw`UPDATE bbs_of SET crew = ${newName} WHERE crew = ${oldName}`;
    await prisma.$executeRaw`
      UPDATE comments SET crew = ${csvRenameSql(Prisma.sql`crew`, oldName, newName)}
      WHERE FIND_IN_SET(${oldName}, crew)
    `;
  }

  broadcast("site:crews", { type: "updated", id: body.id, name: newName });
  return apiOk({ status: true, name: newName, crewurl: urlsafe(newName) });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);
  const body = deleteParsed.data;

  await prisma.$executeRaw`DELETE FROM collys_crews WHERE crew_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM crews WHERE id = ${body.id}`;
  broadcast("site:crews", { type: "deleted", id: body.id });
  return apiOk({ status: true });
}
