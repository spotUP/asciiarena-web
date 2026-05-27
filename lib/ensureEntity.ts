import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";
import { urlsafe } from "@/lib/utils";

/**
 * Look up an artist by case-insensitive nick. If missing, INSERT a stub row
 * (nick + artisturl, everything else nullable) and broadcast site:artists
 * so the listing-page pill fires. Returns the resolved artist id, or null
 * for empty input.
 *
 * Used by the colly + artist submission flows so users can type a brand-new
 * artist nick in the picker without having to leave the form and create the
 * artist row first.
 */
export async function ensureArtistId(rawNick: string): Promise<number | null> {
  const nick = rawNick.trim();
  if (!nick) return null;
  const existing = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM artists WHERE LOWER(nick) = LOWER(${nick}) LIMIT 1`
  );
  if (existing[0]) return existing[0].id;
  const slug = urlsafe(nick);
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO artists (nick, artisturl) VALUES (${nick}, ${slug})`
  );
  const created = await prisma.$queryRaw<[{ id: number }]>(
    Prisma.sql`SELECT LAST_INSERT_ID() AS id`
  );
  const id = created[0]?.id ?? null;
  if (id) broadcast("site:artists", { type: "added", nick });
  return id;
}

/**
 * Same shape as ensureArtistId but for crews (matched by `name`, slug
 * stored as `crewurl`). `active` has a default in the schema, so the
 * INSERT only specifies the required columns.
 */
export async function ensureCrewId(rawName: string): Promise<number | null> {
  const name = rawName.trim();
  if (!name) return null;
  const existing = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM crews WHERE LOWER(name) = LOWER(${name}) LIMIT 1`
  );
  if (existing[0]) return existing[0].id;
  const slug = urlsafe(name);
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO crews (name, crewurl) VALUES (${name}, ${slug})`
  );
  const created = await prisma.$queryRaw<[{ id: number }]>(
    Prisma.sql`SELECT LAST_INSERT_ID() AS id`
  );
  const id = created[0]?.id ?? null;
  if (id) broadcast("site:crews", { type: "added", name });
  return id;
}

/**
 * BBSes are joined by name (not id) in `bbs_of`, so this helper only
 * checks that the BBS exists and creates a stub row when it doesn't.
 * Returns the canonical name string for the caller to pass to bbs_of.
 */
export async function ensureBbsName(rawName: string): Promise<string | null> {
  const name = rawName.trim();
  if (!name) return null;
  const existing = await prisma.$queryRaw<{ name: string }[]>(
    Prisma.sql`SELECT name FROM bbses WHERE LOWER(name) = LOWER(${name}) LIMIT 1`
  );
  if (existing[0]) return existing[0].name;
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO bbses (name) VALUES (${name})`
  );
  broadcast("site:bbs", { type: "added", name });
  return name;
}
