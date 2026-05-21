import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

const patchSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(200).optional(),
  active: z.string().max(10).optional(),
  www: z.string().max(500).optional(),
  acronym: z.string().max(50).optional(),
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

  await prisma.$executeRaw`
    UPDATE crews SET
      name = COALESCE(${body.name ?? null}, name),
      active = COALESCE(${body.active ?? null}, active),
      www = COALESCE(${body.www ?? null}, www),
      acronym = COALESCE(${body.acronym ?? null}, acronym)
    WHERE id = ${body.id}
  `;
  return apiOk({ status: true });
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
  return apiOk({ status: true });
}
