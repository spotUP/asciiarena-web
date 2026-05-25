import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return apiOk([]);

  const myId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<Array<{ id: number; nick: string }>>`
    SELECT id, nick FROM users
    WHERE nick LIKE ${q + "%"} AND id != ${myId} AND nick IS NOT NULL
    ORDER BY nick ASC
    LIMIT 8
  `;

  return apiOk(rows.map(r => ({ id: r.id, nick: r.nick })));
}
