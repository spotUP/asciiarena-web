import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { type LogoMapEntry } from "@/lib/logoMapPayload";
import { serializeLogoMap, logoCountOf } from "@/lib/collyLogoSnapshot";
import { buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { loadEntityDicts } from "@/lib/collyLogoIndex";

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
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.colly_logo_edits.create({
      data: {
        colly_id: collyId,
        user_id: userId,
        timestamp: Math.floor(Date.now() / 1000),
        map: serializeLogoMap(logos),
        logo_count: logoCountOf(logos),
      },
    }),
    prisma.colly_logos.deleteMany({ where: { colly_id: collyId } }),
  ];
  // Manual rows drive rendering and search, exactly as an artist-tagged upload does.
  if (rows.length) {
    ops.push(prisma.colly_logos.createMany({ data: rows.map((r) => ({ ...r, manual: 1 })) }));
  }
  await prisma.$transaction(ops);
  return { logoCount: logoCountOf(logos), rowCount: rows.length };
}
