import { Prisma } from "@/lib/generated/prisma/client";

// Renaming an artist has to carry the old handle with it. Most joins use ids
// (artists_collys, colly_logos) and look after themselves, but two legacy
// tables key on the name text and would silently orphan:
//
//   member_of.nick   — crew memberships, one row per (crew, nick)
//   comments.artist  — a comma-joined list of the colly's artists, denormalized
//                      at comment time and read by the legacy rating recalc
//
// member_of is a plain equality update. comments.artist needs one name swapped
// inside a comma-separated list, which `renameInCsv` describes and
// `csvRenameSql` performs in MySQL. Keep the two in step — the test suite
// pins the semantics of the JS side.

/** Swap `oldName` for `newName` in a comma-joined list, leaving others alone. */
export function renameInCsv(list: string | null | undefined, oldName: string, newName: string): string {
  if (!list) return "";
  return list
    .split(",")
    .map((part) => (part.trim() === oldName ? newName : part.trim()))
    .filter(Boolean)
    .join(",");
}

/**
 * MySQL expression doing what `renameInCsv` does, for the denormalized
 * `comments.artist` / `comments.crew` columns. Pair it with a
 * `FIND_IN_SET(oldName, column)` guard so untouched rows are not rewritten.
 */
export function csvRenameSql(column: Prisma.Sql, oldName: string, newName: string): Prisma.Sql {
  return Prisma.sql`TRIM(BOTH ',' FROM REPLACE(CONCAT(',', ${column}, ','), ${`,${oldName},`}, ${`,${newName},`}))`;
}
