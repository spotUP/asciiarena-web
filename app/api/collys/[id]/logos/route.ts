import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/live";
import { logoMapSchema, type LogoMapEntry } from "@/lib/logoMapPayload";
import { writeLogoEdit } from "@/lib/collyLogoWrite";
import { parseLogoMap } from "@/lib/collyLogoSnapshot";
import { readManualLogoMap } from "@/lib/collyLogoManualMap";
import {
  secondsUntilNextLogoSave,
  secondsUntilUserQuotaFrees,
  LOGO_SAVE_USER_WINDOW_MAX,
  LOGO_SAVE_USER_WINDOW_SECONDS,
} from "@/lib/logoSaveRateLimit";

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

  const userId = Number(session.user.id);

  // Throttle: this endpoint is open to every logged-in user and each save
  // appends a MEDIUMTEXT snapshot that is never pruned. The user's own newest
  // snapshot on this colly is the only state the window needs, so the limit
  // costs one indexed read and survives restarts.
  const now = Math.floor(Date.now() / 1000);
  const lastOwnEdit = await prisma.colly_logo_edits.findFirst({
    where: { colly_id: collyId, user_id: userId },
    orderBy: { id: "desc" },
    select: { timestamp: true },
  });
  const wait = secondsUntilNextLogoSave(lastOwnEdit?.timestamp, now);
  if (wait > 0) {
    return apiError(`Saving too often. Wait ${wait} second${wait === 1 ? "" : "s"} and save again.`, 429);
  }

  // Second throttle, spanning every colly. The gap above is per (user, colly),
  // so a script walking a list of colly ids never trips it -- it can append one
  // large snapshot per colly, on a loop, unthrottled. Both limits read
  // `colly_logo_edits`, so they cost one indexed query each and survive a
  // restart with no in-memory state to lose.
  const recentOwnEdits = await prisma.colly_logo_edits.findMany({
    where: { user_id: userId, timestamp: { gte: now - LOGO_SAVE_USER_WINDOW_SECONDS } },
    orderBy: { timestamp: "asc" },
    take: LOGO_SAVE_USER_WINDOW_MAX,
    select: { timestamp: true },
  });
  const quotaWait = secondsUntilUserQuotaFrees(recentOwnEdits.map((e) => e.timestamp), now);
  if (quotaWait > 0) {
    const minutes = Math.ceil(quotaWait / 60);
    const windowMinutes = LOGO_SAVE_USER_WINDOW_SECONDS / 60;
    return apiError(
      `Saving too often. You can save at most ${LOGO_SAVE_USER_WINDOW_MAX} logo maps every ${windowMinutes} minutes. `
      + `Wait ${minutes} minute${minutes === 1 ? "" : "s"} and save again.`,
      429,
    );
  }

  const result = await writeLogoEdit(collyId, userId, parsed.data.logos);

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
    // Shared with the baseline snapshot the first public save takes, so the
    // map preserved there is exactly the map shown here.
    const manual = await readManualLogoMap(collyId);
    current = manual.length ? manual : null;
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
