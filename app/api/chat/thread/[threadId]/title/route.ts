import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { getMember, getActiveParticipants, renameThread, isParticipant } from "@/lib/chatThreadDb";
import { resolveDisplayTitle } from "@/lib/chatThread";

const patchSchema = z.object({ title: z.string().max(128) });

async function threadParam(params: Promise<{ threadId: string }>): Promise<number> {
  const { threadId } = await params;
  return parseInt(threadId);
}

// The first message's subject. 'Chat' is the sentinel the live-chat send route
// stamps on threads it creates — treat it as "no subject" so DMs fall back to
// the peer's nick rather than literally showing "Chat".
async function threadSubject(thread: number): Promise<string | null> {
  const rows = await prisma.$queryRaw<[{ subject: string | null }?]>`
    SELECT subject FROM messages WHERE thread = ${thread} ORDER BY id ASC LIMIT 1
  `;
  const s = rows[0]?.subject ?? null;
  return s === "Chat" ? null : s;
}

async function resolvedTitle(thread: number, me: number, override: string | null): Promise<string> {
  const others = (await getActiveParticipants(thread)).filter(p => p.userId !== me).map(p => p.nick);
  const subject = await threadSubject(thread);
  return resolveDisplayTitle(override, subject, others);
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const thread = await threadParam(ctx.params);
  const me = parseInt(session.user.id);
  const member = await getMember(thread, me);
  if (!member) return apiError("Not a participant", 403);
  return apiOk({ title: await resolvedTitle(thread, me, member.title) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const thread = await threadParam(ctx.params);
  const me = parseInt(session.user.id);
  if (!(await isParticipant(thread, me))) return apiError("Not a participant", 403);

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  await renameThread(thread, me, parsed.data.title);
  const member = await getMember(thread, me);
  return apiOk({ title: await resolvedTitle(thread, me, member?.title ?? null) });
}
