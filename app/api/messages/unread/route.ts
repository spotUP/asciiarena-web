import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { apiError, apiOk } from "@/lib/utils";
import { unreadCountExpr } from "@/lib/chatUnreadSql";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);
  // Legacy chat rows identify their sender by nick alone -- see unreadCountExpr.
  const userNick = session.user.name ?? "";

  try {
    // The same expression the inbox list selects, so the navbar badge and the
    // list it links to cannot report different numbers.
    const rows = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COALESCE(SUM(${unreadCountExpr(userId, userNick)}), 0) AS count
      FROM chat_participants cp
      WHERE cp.user_id = ${userId} AND cp.left_at IS NULL
    `;
    return apiOk({ count: Number(rows[0]?.count ?? 0) });
  } catch {
    return apiOk({ count: 0 });
  }
}
