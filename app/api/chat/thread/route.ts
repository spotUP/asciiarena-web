import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { isSelfDm, SELF_DM_MESSAGE } from "@/lib/chatPeer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const peerId = parseInt(request.nextUrl.searchParams.get("peerId") ?? "");
  if (!peerId || isNaN(peerId)) return apiError("peerId required", 400);

  const myId = parseInt(session.user.id);

  // A self peer is refused before the lookup runs, not merely hidden in the UI.
  // The WHERE clause below collapses to `from_id = me AND to_id = me` when peer
  // == me, which matches any self-addressed row left over from an earlier
  // self-chat -- and returns whatever thread that row now belongs to, group
  // members and all.
  if (isSelfDm(peerId, myId)) return apiError(SELF_DM_MESSAGE, 400);

  // Prefer rows that have a proper thread id; ignore legacy rows where thread = 0.
  const rows = await prisma.$queryRaw<[{ thread: number }?]>`
    SELECT thread FROM messages
    WHERE ((from_id = ${myId} AND to_id = ${peerId})
        OR (from_id = ${peerId} AND to_id = ${myId}))
      AND thread > 0
    ORDER BY id DESC LIMIT 1
  `;

  return apiOk({ threadId: rows[0]?.thread ?? null });
}
