import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { apiError, apiOk } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);

  try {
    const rows = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM messages um
           WHERE um.thread = cp.thread_id AND um.timestamp >= cp.joined_at
             AND um.timestamp > cp.last_read_at AND (um.from_id IS NULL OR um.from_id <> ${userId}))
      ), 0) AS count
      FROM chat_participants cp
      WHERE cp.user_id = ${userId} AND cp.left_at IS NULL
    `;
    return apiOk({ count: Number(rows[0]?.count ?? 0) });
  } catch {
    return apiOk({ count: 0 });
  }
}
