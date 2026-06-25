import { Prisma } from "@/lib/generated/prisma/client";

// The rotating header only needs a bounded sample of logos. Take the most
// recent rows first so newly-submitted logos are eligible for rotation instead
// of being pushed out by the oldest entries.
export function buildLogoHeaderRowsQuery(): Prisma.Sql {
  return Prisma.sql`
    SELECT kind, ascii, ansi_b64, font
    FROM logos
    ORDER BY logo_id DESC
  `;
}
