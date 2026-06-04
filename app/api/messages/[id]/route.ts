import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { leaveThread } from "@/lib/chatThreadDb";
import { broadcast } from "@/lib/live";

interface MessageRow {
  id: number;
  thread: number;
  postedto: string | null;
  postername: string | null;
  subject: string | null;
  message: string | null;
  from_id: number | null;
  to_id: number | null;
  timestamp: number | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const messageId = parseInt(id);
  const userId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<MessageRow[]>`
    SELECT * FROM messages WHERE id = ${messageId}
  `;

  const row = rows[0];
  if (!row) return apiError("Not found", 404);

  return apiOk({
    id: row.id,
    thread: row.thread,
    postedto: row.postedto,
    postername: row.postername,
    subject: row.subject,
    message: row.message,
    replyid: row.to_id === userId ? row.from_id : row.to_id,
    timestamp: row.timestamp,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const threadId = parseInt(id);
  const userId = parseInt(session.user.id);

  // "Delete" = leave the conversation (non-destructive; messages preserved for
  // others). The [id] param is the thread id (the client passes threadId here).
  await leaveThread(threadId, userId);
  broadcast(`thread:${threadId}`, { type: "member-left", userId });

  return apiOk({ status: true });
}
