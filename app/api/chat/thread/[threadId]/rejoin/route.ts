import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { prisma } from "@/lib/db";
import { getMember, rejoinThread } from "@/lib/chatThreadDb";

export const dynamic = "force-dynamic";

// POST — rejoin a thread the caller previously left. Reactivates the existing
// participant row (clears left_at, keeps the original joined_at) so the user
// resumes receiving new messages AND regains their full original history. Only
// valid for a row that exists and is currently in the "left" state.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { threadId } = await ctx.params;
  const thread = parseInt(threadId);
  const me = parseInt(session.user.id);

  const member = await getMember(thread, me);
  if (!member) return apiError("Not a participant", 403);
  if (member.leftAt == null) return apiOk({ ok: true, alreadyActive: true });

  await rejoinThread(thread, me);

  const meUser = await prisma.users.findUnique({ where: { id: me }, select: { nick: true } });
  // Tell the thread the member is back, and refresh the user's own inbox so the
  // thread moves out of "Left chats" and back into the active list.
  broadcast(`thread:${thread}`, { type: "member-joined", userId: me, nick: meUser?.nick ?? "" });
  broadcast(`user:${me}:messages`, { type: "thread-added", threadId: thread, byNick: meUser?.nick ?? "" });

  return apiOk({ ok: true });
}
