import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { BELL_NOTIFICATION_TYPES } from "@/lib/notification-types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Not logged in", 401);
  const userId = parseInt(session.user.id);

  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20)
  );
  const beforeRaw = req.nextUrl.searchParams.get("before");
  const before = beforeRaw ? parseInt(beforeRaw, 10) : null;

  // The same type filter for the list and the badge — a badge counting rows
  // the dropdown will not show is a permanently unclearable number.
  const rows = await prisma.notifications.findMany({
    where: {
      user_id: userId,
      type: { in: BELL_NOTIFICATION_TYPES },
      ...(before ? { id: { lt: before } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notifications.count({
    where: { user_id: userId, type: { in: BELL_NOTIFICATION_TYPES }, read_at: null },
  });

  return NextResponse.json({
    notifications: rows.map(r => ({
      id: r.id,
      kind: r.type,
      actorNick: r.actor_nick,
      target: r.target,
      targetUrl: r.target_url,
      readAt: r.read_at,
      createdAt: r.created_at,
    })),
    unreadCount,
  });
}
