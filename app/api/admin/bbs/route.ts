import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

const patchSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(200).optional(),
  sysop: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  software: z.string().max(200).optional(),
  online: z.boolean().optional(),
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
  const rows = await prisma.$queryRaw<{ id: number; name: string; sysop: string | null; address: string | null; software: string | null; online: boolean }[]>`
    SELECT id, name, sysop, address, software, online FROM bbses
    WHERE name LIKE ${like} OR sysop LIKE ${like} ORDER BY name ASC LIMIT 30
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
    UPDATE bbses SET
      name = COALESCE(${body.name ?? null}, name),
      sysop = COALESCE(${body.sysop ?? null}, sysop),
      address = COALESCE(${body.address ?? null}, address),
      software = COALESCE(${body.software ?? null}, software),
      online = COALESCE(${body.online ?? null}, online)
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

  await prisma.$executeRaw`DELETE FROM bbs_of WHERE name = (SELECT name FROM bbses WHERE id = ${body.id})`;
  await prisma.$executeRaw`DELETE FROM bbses WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
