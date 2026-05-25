import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const nick = request.nextUrl.searchParams.get("nick")?.trim();
  if (!nick) return apiError("nick required", 400);

  const rows = await prisma.$queryRaw<[{ id: number; nick: string }?]>`
    SELECT id, nick FROM users WHERE LOWER(nick) = LOWER(${nick}) LIMIT 1
  `;

  if (!rows[0]) return apiError("User not found", 404);
  return apiOk({ id: rows[0].id, nick: rows[0].nick });
}
