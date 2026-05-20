import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

interface GroupRow {
  id: number;
  name: string;
  owner_id: number;
  created_at: number;
}

interface MemberRow {
  group_id: number;
  user_id: number;
  nick: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);

  const groups = await prisma.$queryRaw<GroupRow[]>`
    SELECT DISTINCT fg.id, fg.name, fg.owner_id, fg.created_at
    FROM font_groups fg
    LEFT JOIN font_group_members fgm ON fgm.group_id = fg.id
    WHERE fg.owner_id = ${userId} OR fgm.user_id = ${userId}
    ORDER BY fg.name
  `;

  const members = await prisma.$queryRaw<MemberRow[]>`
    SELECT fgm.group_id, fgm.user_id, u.nick
    FROM font_group_members fgm
    JOIN users u ON u.id = fgm.user_id
    WHERE fgm.group_id IN (
      SELECT DISTINCT fg.id FROM font_groups fg
      LEFT JOIN font_group_members m ON m.group_id = fg.id
      WHERE fg.owner_id = ${userId} OR m.user_id = ${userId}
    )
  `;

  const membersByGroup = members.reduce<Record<number, { user_id: number; nick: string }[]>>((acc, m) => {
    if (!acc[m.group_id]) acc[m.group_id] = [];
    acc[m.group_id].push({ user_id: m.user_id, nick: m.nick });
    return acc;
  }, {});

  return apiOk(groups.map(g => ({
    id: g.id,
    name: g.name,
    owner_id: g.owner_id,
    is_owner: g.owner_id === userId,
    members: membersByGroup[g.id] ?? [],
  })));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);

  const body = await request.json() as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return apiError("name is required", 400);

  await prisma.$executeRaw`
    INSERT INTO font_groups (name, owner_id, created_at) VALUES (${name}, ${userId}, UNIX_TIMESTAMP())
  `;

  return apiOk({ status: true }, 201);
}
