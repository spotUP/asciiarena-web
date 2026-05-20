import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);
  const { id } = await params;
  const groupId = parseInt(id);

  const result = await prisma.$executeRaw`
    DELETE FROM font_groups WHERE id = ${groupId} AND owner_id = ${userId}
  `;

  if (result === 0) return apiError("Not found or not owner", 403);
  return apiOk({ status: true });
}
