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
  const rows = await prisma.$queryRaw<{ id: number; nick: string; nickurl: string; rank: string | null; crew: string | null; mail: string | null }[]>`
    SELECT id, nick, nickurl, \`rank\`, crew, mail FROM users
    WHERE nick LIKE ${like} ORDER BY nick ASC LIMIT 30
  `;
  return apiOk(rows);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number; rank?: string; crew?: string };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`
    UPDATE users SET
      \`rank\` = COALESCE(${body.rank ?? null}, \`rank\`),
      crew = COALESCE(${body.crew ?? null}, crew)
    WHERE id = ${body.id}
  `;
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`DELETE FROM users WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
