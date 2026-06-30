import { prisma } from "@/lib/db";
import { readCollyText } from "@/lib/collyText";
import { buildLogoRows } from "@/lib/collyLogoRows";
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
// catalog rows atomically. Idempotent. Reads the file but persists only labels.
// Pass `dicts` during bulk backfill to avoid reloading them per colly.
export async function indexColly(
  collyId: number,
  filename: string,
  storedType?: string | null,
  dicts?: EntityDicts,
): Promise<IndexResult> {
  const text = readCollyText(filename, storedType);
  const d = dicts ?? (await getDicts());
  const rows = text == null ? [] : buildLogoRows(collyId, text, d);
  const ops: Promise<unknown>[] = [prisma.colly_logos.deleteMany({ where: { colly_id: collyId } })];
  if (rows.length) ops.push(prisma.colly_logos.createMany({ data: rows }));
  await prisma.$transaction(ops as never);
  return { logos: rows.length, resolved: rows.filter((r) => r.artist_id || r.crew_id || r.user_id).length };
}
