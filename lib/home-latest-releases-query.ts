import { Prisma } from "@/lib/generated/prisma/client";

export function buildLatestReleaseRowsQuery(random: boolean): Prisma.Sql {
  const orderClause = random
    ? Prisma.raw("ORDER BY RAND()")
    : Prisma.raw("ORDER BY fyear DESC, fmonth DESC, fday DESC");

  return Prisma.sql`
    SELECT 'C' AS type, filename,
      year AS fyear, month AS fmonth, day AS fday
    FROM collys
    ${orderClause}
    LIMIT 20
  `;
}
