import { readFileSync } from "fs";
import { prisma } from "@/lib/db";
import { readCollyText, collyFilePath } from "@/lib/collyText";
import { buildLogoRows, buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { parseCollyBytes } from "@/lib/collyTrailer";
import { normalizeHandle, type EntityDicts, type EntityRef } from "@/lib/handleMatch";

export { buildLogoRows, type LogoRow } from "@/lib/collyLogoRows";

// Build the normalized entity dictionaries (nick/name + acronym) for resolution.
export async function loadEntityDicts(): Promise<EntityDicts> {
  const [artists, crews, users] = await Promise.all([
    prisma.artists.findMany({ select: { id: true, nick: true, acronym: true } }),
    prisma.crews.findMany({ select: { id: true, name: true, acronym: true } }),
    prisma.users.findMany({ select: { id: true, nick: true } }),
  ]);
  const push = (out: EntityRef[], id: number, ...names: (string | null | undefined)[]) => {
    for (const name of names) {
      const norm = name ? normalizeHandle(name) : "";
      if (norm) out.push({ id, norm });
    }
  };
  const artistRefs: EntityRef[] = [];
  for (const a of artists) push(artistRefs, a.id, a.nick, a.acronym);
  const crewRefs: EntityRef[] = [];
  for (const c of crews) push(crewRefs, c.id, c.name, c.acronym);
  const userRefs: EntityRef[] = [];
  for (const u of users) push(userRefs, u.id, u.nick);
  return { artists: artistRefs, crews: crewRefs, users: userRefs };
}

let cache: { dicts: EntityDicts; at: number } | null = null;
async function getDicts(): Promise<EntityDicts> {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.dicts;
  const dicts = await loadEntityDicts();
  cache = { dicts, at: Date.now() };
  return dicts;
}

export interface IndexResult {
  logos: number;
  resolved: number;
}

// (Re)index one colly: read its file, extract+resolve logo labels, replace its
// catalog rows atomically, and refresh the full-content search column.
// Idempotent. Reads the file but persists only labels + plaintext.
// Pass `dicts` during bulk backfill to avoid reloading them per colly.
export async function indexColly(
  collyId: number,
  filename: string,
  storedType?: string | null,
  dicts?: EntityDicts,
): Promise<IndexResult> {
  return rebuildDetectedLayers(collyId, filename, storedType, dicts, true);
}

/**
 * Restore ONLY the auto-detected (manual = 0) catalog layer, leaving
 * `collys.content_text` untouched.
 *
 * Same detection as `indexColly` -- the difference is the content column. That
 * column holds up to 5 MB of plaintext, and rewriting it is by far the largest
 * write either path makes (row, binlog, replication). The public save route
 * calls this whenever a save leaves no catalog rows, so it must write only what
 * the rebuild actually needs: the logo rows. `content_text` cannot have gone
 * stale, because a colly's file never changes after upload.
 */
export async function rebuildAutoLogoLayer(
  collyId: number,
  filename: string,
  storedType?: string | null,
  dicts?: EntityDicts,
): Promise<IndexResult> {
  return rebuildDetectedLayers(collyId, filename, storedType, dicts, false);
}

async function rebuildDetectedLayers(
  collyId: number,
  filename: string,
  storedType: string | null | undefined,
  dicts: EntityDicts | undefined,
  syncContentText: boolean,
): Promise<IndexResult> {
  const d = dicts ?? (await getDicts());
  // Auto-detected catalog rows (manual = 0). A colly that's been mapped in the
  // editor has manual rows written by the upload route, which take precedence and
  // are NOT overwritten here (this only refreshes the auto layer).
  const text = readCollyText(filename, storedType);
  const rows = text == null ? [] : buildLogoRows(collyId, text, d);
  const ops: Promise<unknown>[] = [prisma.colly_logos.deleteMany({ where: { colly_id: collyId, manual: 0 } })];
  if (rows.length) ops.push(prisma.colly_logos.createMany({ data: rows }));
  // Keep the full-content search index in sync from the same decoded text, so a
  // re-index backfills content_text for every colly in one pass.
  if (syncContentText && text != null) {
    ops.push(prisma.$executeRaw`UPDATE collys SET content_text = ${text.slice(0, 5_000_000)} WHERE id = ${collyId}`);
  }
  await prisma.$transaction(ops as never);
  return { logos: rows.length, resolved: rows.filter((r) => r.artist_id || r.crew_id || r.user_id).length };
}
