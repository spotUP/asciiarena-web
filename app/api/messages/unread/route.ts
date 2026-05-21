import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) AS count
    FROM messages
    WHERE to_id = ${userId}
      AND \`new\` = 1
  `;

  const count = Number(rows[0]?.count ?? 0);
  return apiOk({ count });
}
