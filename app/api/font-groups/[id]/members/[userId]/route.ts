import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { sameUserId } from "@/lib/userId";

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

  // owner_id is INT UNSIGNED read through $queryRaw, so it arrives as a BigInt:
  // a plain `===` against the parsed session id is never true and the group
  // owner could remove nobody but themselves. See lib/userId.ts.
  const isOwner = sameUserId(rows[0].owner_id, currentUserId);
  const isSelf = sameUserId(targetUserId, currentUserId);

  if (!isOwner && !isSelf) return apiError("Forbidden", 403);

  await prisma.$executeRaw`
    DELETE FROM font_group_members WHERE group_id = ${groupId} AND user_id = ${targetUserId}
  `;

  return apiOk({ status: true });
}
