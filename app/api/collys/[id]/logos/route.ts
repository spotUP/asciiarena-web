import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/live";
import { logoMapSchema } from "@/lib/logoMapPayload";
import { writeLogoEdit } from "@/lib/collyLogoWrite";

const postSchema = z.object({ logos: logoMapSchema });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId) || collyId <= 0) return apiError("Invalid id", 400);

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  // Check the colly exists BEFORE writing, so a bad id never leaves an
  // orphaned snapshot behind.
  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { id: true, filename: true } });
  if (!colly) return apiError("Not found", 404);

  const result = await writeLogoEdit(collyId, Number(session.user.id), parsed.data.logos);

  if (colly.filename) revalidatePath("/release/" + colly.filename);
  broadcast(`release:${collyId}:logos`, { type: "tagged", nick: session.user.name ?? "" });

  return apiOk({ status: true, ...result });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId) || collyId <= 0) return apiError("Invalid id", 400);

  const edits = await prisma.colly_logo_edits.findMany({
    where: { colly_id: collyId },
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, user_id: true, timestamp: true, logo_count: true },
  });
  if (!edits.length) return apiOk([]);

  const users = await prisma.users.findMany({
    where: { id: { in: edits.map((e) => e.user_id) } },
    select: { id: true, nick: true },
  });
  const nick = new Map(users.map((u) => [u.id, u.nick]));

  return apiOk(edits.map((e) => ({
    id: e.id,
    nick: nick.get(e.user_id) ?? "unknown",
    timestamp: e.timestamp,
    logoCount: e.logo_count,
  })));
}
