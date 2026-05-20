import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

interface CountRow {
  cnt: bigint | number;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const fontId = parseInt(id);
  const userId = parseInt(session.user.id);

  const ownerRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS cnt FROM styles WHERE id = ${fontId} AND user_ids = ${userId}
  `;

  if (Number(ownerRows[0]?.cnt ?? 0) === 0) {
    return apiError("Forbidden", 403);
  }

  await prisma.$executeRaw`
    DELETE FROM styles WHERE id = ${fontId} AND user_ids = ${userId}
  `;

  return apiOk({ status: true });
}
