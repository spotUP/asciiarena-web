import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { type LogoMapEntry } from "@/lib/logoMapPayload";
import { serializeLogoMap, logoCountOf } from "@/lib/collyLogoSnapshot";
import { buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { loadEntityDicts, rebuildAutoLogoLayer } from "@/lib/collyLogoIndex";
import { readManualLogoMap } from "@/lib/collyLogoManualMap";

/**
 * Author of a baseline snapshot. A pre-feature map was made in the admin
 * editor, which recorded nobody, so it belongs to no user: 0 matches no row in
 * `users` and the history renders it as "unknown". Attributing it to the
 * member whose save triggered it would credit them with someone else's work,
 * and attributing it to the colly's uploader would credit a real, named person
 * with a map they may never have touched.
 */
export const BASELINE_EDIT_USER_ID = 0;

/**
 * Append a snapshot and rebuild the colly's catalog rows from it, atomically.
 * A snapshot without its rebuild (or the reverse) would leave search
 * disagreeing with the recorded history, so both go in one transaction.
 *
 * Shared by the public save route and the admin revert route, which replays an
 * old map through here.
 */
export async function writeLogoEdit(
  collyId: number,
  userId: number,
  logos: LogoMapEntry[],
): Promise<{ logoCount: number; rowCount: number }> {
  const rows = buildLogoRowsFromMap(collyId, logos, await loadEntityDicts());
  const now = Math.floor(Date.now() / 1000);
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  // A colly tagged before this feature has its map ONLY as manual
  // `colly_logos` rows -- not in a snapshot, and not in the file trailer
  // (admin-editor maps are database-only). This write deletes those rows, so
  // without a baseline the prior map would exist nowhere and [restore] would
  // have nothing to restore to. Snapshot it first, as its own history entry.
  const baseline = await baselineMapToPreserve(collyId);
  if (baseline.length) {
    ops.push(prisma.colly_logo_edits.create({
      data: {
        colly_id: collyId,
        user_id: BASELINE_EDIT_USER_ID,
        timestamp: now,
        map: serializeLogoMap(baseline),
        logo_count: logoCountOf(baseline),
      },
    }));
  }

  ops.push(prisma.colly_logo_edits.create({
    data: {
      colly_id: collyId,
      user_id: userId,
      timestamp: now,
      map: serializeLogoMap(logos),
      logo_count: logoCountOf(logos),
    },
  }));
  ops.push(prisma.colly_logos.deleteMany({ where: { colly_id: collyId } }));
  // Manual rows drive rendering and search, exactly as an artist-tagged upload does.
  if (rows.length) {
    ops.push(prisma.colly_logos.createMany({ data: rows.map((r) => ({ ...r, manual: 1 })) }));
  }
  await prisma.$transaction(ops);

  // The delete above took the auto-detected layer with it, so a save that
  // leaves NO catalog rows drops the colly out of logo search entirely until an
  // admin reruns the reindex tool. Put the auto layer back -- same machinery as
  // an untagged upload.
  //
  // The trigger is the absence of resulting ROWS, not of map entries: a map is
  // free of catalog rows whenever every caption is blank or fails
  // `isLikelyLogoLabel`, which `buildLogoRowsFromMap` drops. The tagging panel
  // seeds unsearchable auto-detected bands with an empty caption, so a member
  // who saves without captioning them sends a non-empty map that indexes to
  // nothing -- exactly the case an `!logos.length` trigger would miss.
  if (!rows.length) await restoreAutoDetectedLayer(collyId);

  return { logoCount: logoCountOf(logos), rowCount: rows.length };
}

/**
 * The pre-feature admin map that this write is about to destroy, or an empty
 * map when there is nothing to preserve: either the colly has snapshots
 * already (its history holds the prior state) or it has no manual rows.
 *
 * Read outside the transaction, like the caller's own existence checks. The
 * worst case if two first-ever saves race is a duplicate baseline entry in the
 * history -- append-only, and never a lost map.
 */
async function baselineMapToPreserve(collyId: number): Promise<LogoMapEntry[]> {
  const snapshots = await prisma.colly_logo_edits.count({ where: { colly_id: collyId } });
  if (snapshots > 0) return [];
  return readManualLogoMap(collyId);
}

/**
 * Rebuild the auto-detected (manual = 0) catalog layer for a colly whose map
 * indexed to nothing. Non-fatal: the snapshot is already committed, and a colly
 * whose file cannot be read must not turn a successful save into a 500.
 *
 * Deliberately NOT `indexColly`: that also rewrites `collys.content_text` (up
 * to 5 MB) which cannot have changed, and this runs on the open public save
 * endpoint whose write volume is the thing the rate limit exists to bound.
 */
async function restoreAutoDetectedLayer(collyId: number): Promise<void> {
  try {
    const colly = await prisma.collys.findUnique({
      where: { id: collyId },
      select: { filename: true, type: true },
    });
    if (!colly?.filename) return;
    await rebuildAutoLogoLayer(collyId, colly.filename, colly.type);
  } catch {
    /* search index only -- the history snapshot is what must not be lost */
  }
}
