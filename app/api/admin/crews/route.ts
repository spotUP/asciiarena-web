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
  const rows = await prisma.$queryRaw<{ id: number; name: string; crewurl: string; active: string | null; www: string | null; acronym: string | null }[]>`
    SELECT id, name, crewurl, active, www, acronym FROM crews
    WHERE name LIKE ${like} ORDER BY name ASC LIMIT 30
  `;
  return apiOk(rows);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number; name?: string; active?: string; www?: string; acronym?: string };
  if (!body.id) return apiError("id required", 400);

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

  const body = await request.json() as { id: number };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`DELETE FROM collys_crews WHERE crew_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM crews WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
