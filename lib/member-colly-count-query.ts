import { Prisma } from "@/lib/generated/prisma/client";

/**
 * How many collys a member has uploaded.
 *
 * Deliberately separate from the "last 10 collys" list query on the profile
 * page: that one is paged, and the page used to render its length as the total,
 * so every uploader with more than ten releases was reported as having exactly
 * ten. Deduped by filename to match the list's `GROUP BY c.filename`, so the
 * sentence and the table under it always agree.
 */
export function buildMemberCollyCountQuery(memberId: number): Prisma.Sql {
  return Prisma.sql`
    SELECT COUNT(DISTINCT c.filename) AS total
    FROM collys c
    WHERE c.uploader_id = ${memberId}
  `;
}
