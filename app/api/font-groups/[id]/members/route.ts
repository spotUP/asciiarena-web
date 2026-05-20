import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);
  const { id } = await params;
  const groupId = parseInt(id);

  // Only group owner can invite
  const rows = await prisma.$queryRaw<{ owner_id: number }[]>`
    SELECT owner_id FROM font_groups WHERE id = ${groupId}
  `;
  if (!rows[0]) return apiError("Group not found", 404);
  if (rows[0].owner_id !== userId) return apiError("Only the group owner can invite members", 403);

  const body = await request.json() as { nick?: string };
  const nick = (body.nick ?? "").trim();
  if (!nick) return apiError("nick is required", 400);

  const userRows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE nick = ${nick}
  `;
  if (!userRows[0]) return apiError(`User '${nick}' not found`, 404);
  const inviteeId = userRows[0].id;

  if (inviteeId === userId) return apiError("Cannot add yourself", 400);

  await prisma.$executeRaw`
    INSERT IGNORE INTO font_group_members (group_id, user_id) VALUES (${groupId}, ${inviteeId})
  `;

  return apiOk({ status: true });
}
