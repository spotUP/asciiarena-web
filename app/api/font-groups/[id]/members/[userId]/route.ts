import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const currentUserId = parseInt(session.user.id);
  const { id, userId: targetUserIdStr } = await params;
  const groupId = parseInt(id);
  const targetUserId = parseInt(targetUserIdStr);

  const rows = await prisma.$queryRaw<{ owner_id: number }[]>`
    SELECT owner_id FROM font_groups WHERE id = ${groupId}
  `;
  if (!rows[0]) return apiError("Group not found", 404);

  const isOwner = rows[0].owner_id === currentUserId;
  const isSelf = targetUserId === currentUserId;

  if (!isOwner && !isSelf) return apiError("Forbidden", 403);

  await prisma.$executeRaw`
    DELETE FROM font_group_members WHERE group_id = ${groupId} AND user_id = ${targetUserId}
  `;

  return apiOk({ status: true });
}
