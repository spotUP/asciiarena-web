import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { checkRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";
import {
  isParticipant, addParticipant, leaveThread, getActiveParticipants,
} from "@/lib/chatThreadDb";

const addSchema = z.object({ userId: z.number().int().positive() });

async function threadParam(params: Promise<{ threadId: string }>): Promise<number> {
  const { threadId } = await params;
  return parseInt(threadId);
}

// GET — list active participants
export async function GET(_req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const thread = await threadParam(ctx.params);
  const me = parseInt(session.user.id);
  if (!(await isParticipant(thread, me))) return apiError("Not a participant", 403);
  return apiOk(await getActiveParticipants(thread));
}

// POST — add a member
export async function POST(req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const thread = await threadParam(ctx.params);
  const me = parseInt(session.user.id);

  if (!(await isParticipant(thread, me))) return apiError("Not a participant", 403);
  if (!checkRateLimit(`addmember:${me}:${thread}`, 10, 60_000)) return apiError("Slow down", 429);

  const body = await req.json().catch(() => ({}));
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);
  const newUserId = parsed.data.userId;

  const user = await prisma.users.findUnique({ where: { id: newUserId }, select: { nick: true } });
  if (!user) return apiError("No such user", 400);

  await addParticipant(thread, newUserId);

  broadcast(`thread:${thread}`, { type: "member-joined", userId: newUserId, nick: user.nick });
  broadcast(`user:${newUserId}:messages`, { type: "thread-added", threadId: thread, byNick: session.user.name ?? "" });

  return apiOk({ ok: true });
}

// DELETE — leave the thread yourself
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const thread = await threadParam(ctx.params);
  const me = parseInt(session.user.id);

  const meUser = await prisma.users.findUnique({ where: { id: me }, select: { nick: true } });
  await leaveThread(thread, me);
  broadcast(`thread:${thread}`, { type: "member-left", userId: me, nick: meUser?.nick ?? "" });
  return apiOk({ ok: true });
}
