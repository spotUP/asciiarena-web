import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/live";
import { logoMapSchema, type LogoMapEntry } from "@/lib/logoMapPayload";
import { writeLogoEdit } from "@/lib/collyLogoWrite";
import { parseLogoMap } from "@/lib/collyLogoSnapshot";

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

  // History + "current" map both come from `colly_logo_edits`: the newest
  // snapshot IS the current map (the design's central rule). Only a colly
  // that predates this feature (admin-tagged, never snapshotted) has no
  // edit rows at all -- for that case only, fall back to the manual
  // `colly_logos` rows the old admin editor wrote directly.
  const edits = await prisma.colly_logo_edits.findMany({
    where: { colly_id: collyId },
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, user_id: true, timestamp: true, logo_count: true, map: true },
  });

  let current: LogoMapEntry[] | null;
  if (edits.length) {
    current = parseLogoMap(edits[0].map);
  } else {
    const rows = await prisma.colly_logos.findMany({
      where: { colly_id: collyId, manual: 1 },
      orderBy: { position: "asc" },
      select: { start_line: true, end_line: true, label: true },
    });
    current = rows.length
      ? rows.map((r) => ({
          line: r.start_line + 1,
          end: r.end_line != null ? r.end_line + 1 : undefined,
          caption: r.label,
        }))
      : null;
  }

  if (!edits.length) return apiOk({ current, history: [] });

  const users = await prisma.users.findMany({
    where: { id: { in: edits.map((e) => e.user_id) } },
    select: { id: true, nick: true },
  });
  const nick = new Map(users.map((u) => [u.id, u.nick]));

  return apiOk({
    current,
    history: edits.map((e) => ({
      id: e.id,
      nick: nick.get(e.user_id) ?? "unknown",
      timestamp: e.timestamp,
      logoCount: e.logo_count,
    })),
  });
}
