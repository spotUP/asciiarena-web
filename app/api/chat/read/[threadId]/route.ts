import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { markRead } from "@/lib/chatThreadDb";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { threadId } = await params;
  const thread = parseInt(threadId);
  const userId = parseInt(session.user.id);

  // Participant cursor (group-aware). No-op if the user has no row.
  await markRead(thread, userId);

  // Legacy per-row flags — keep in sync so the un-rewritten inbox (Phase 5)
  // and any legacy reader still clear correctly.
  await prisma.$executeRaw`
    UPDATE messages SET \`new\` = 0, unread = 0
    WHERE thread = ${thread} AND to_id = ${userId}
  `;

  broadcast(`user:${userId}:messages`, { type: "read" });
  return apiOk({ ok: true });
}
