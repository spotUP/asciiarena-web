import { z } from "zod";
import { NextRequest } from "next/server";
import { unlinkSync, existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";

const patchSchema = z.object({
  id: z.number().int().positive(),
  filename: z.string().max(60).optional(),
  name: z.string().max(500).optional(),
  year: z.number().int().nullable().optional(),
  month: z.number().int().nullable().optional(),
  day: z.number().int().nullable().optional(),
  type: z.string().max(50).optional(),
  file_id: z.string().max(60).nullable().optional(),
  artistNames: z.array(z.string().trim().min(1).max(100)).optional(),
  crewNames: z.array(z.string().trim().min(1).max(200)).optional(),
  broken: z.number().int().optional(),
  broken_comment: z.string().max(1000).nullable().optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


interface CollyRow {
  id: number;
  filename: string;
  name: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  type: string | null;
  file_id: string | null;
  artists: string | null;
  crews: string | null;
  broken: number | null;
  broken_comment: string | null;
  uploader: string | null;
  total_count: bigint;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const broken = searchParams.get("broken") === "1";

  let rows: CollyRow[];

  if (broken) {
    rows = await prisma.$queryRaw<CollyRow[]>`
      SELECT id, filename, name, year, month, day, type, file_id, broken, broken_comment, uploader,
             (SELECT GROUP_CONCAT(a.nick ORDER BY a.nick SEPARATOR ', ')
              FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id
              WHERE ac.colly_id = collys.id) AS artists,
             (SELECT GROUP_CONCAT(cr.name ORDER BY cr.name SEPARATOR ', ')
              FROM collys_crews cc JOIN crews cr ON cr.id = cc.crew_id
              WHERE cc.colly_id = collys.id) AS crews,
             COUNT(*) OVER() AS total_count
      FROM collys WHERE broken > 0 ORDER BY broken DESC LIMIT 100
    `;
  } else if (q) {
    const like = `%${q}%`;
    rows = await prisma.$queryRaw<CollyRow[]>`
      SELECT id, filename, name, year, month, day, type, file_id, broken, broken_comment, uploader,
             (SELECT GROUP_CONCAT(a.nick ORDER BY a.nick SEPARATOR ', ')
              FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id
              WHERE ac.colly_id = c.id) AS artists,
             (SELECT GROUP_CONCAT(cr.name ORDER BY cr.name SEPARATOR ', ')
              FROM collys_crews cc JOIN crews cr ON cr.id = cc.crew_id
              WHERE cc.colly_id = c.id) AS crews,
             COUNT(*) OVER() AS total_count
      FROM collys WHERE filename LIKE ${like} OR name LIKE ${like}
      ORDER BY filename ASC LIMIT 50
    `;
  } else {
    return apiOk([]);
  }

  return apiOk(rows.map(r => ({ ...r, total_count: Number(r.total_count) })));
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawPatchBody = await request.json().catch(() => ({}));
  const patchParsed = patchSchema.safeParse(rawPatchBody);
  if (!patchParsed.success) return apiError("Invalid request: " + patchParsed.error.issues[0]?.message, 400);
  const { id, filename, name, year, month, day, type, file_id, artistNames, crewNames, broken, broken_comment } = patchParsed.data;

  await prisma.$executeRaw`
    UPDATE collys SET
      filename = COALESCE(${filename ?? null}, filename),
      name = COALESCE(${name ?? null}, name),
      year = COALESCE(${year ?? null}, year),
      month = COALESCE(${month ?? null}, month),
      day = COALESCE(${day ?? null}, day),
      type = COALESCE(${type ?? null}, type),
      file_id = COALESCE(${file_id ?? null}, file_id),
      broken = COALESCE(${broken ?? null}, broken),
      broken_comment = ${broken_comment ?? null}
    WHERE id = ${id}
  `;

  if (artistNames) {
    await prisma.$executeRaw`DELETE FROM artists_collys WHERE colly_id = ${id}`;
    for (const artistName of artistNames) {
      await prisma.$executeRaw`
        INSERT IGNORE INTO artists_collys (artist_id, colly_id)
        SELECT artists.id, ${id} FROM artists WHERE artists.nick = ${artistName}
      `;
    }
  }

  if (crewNames) {
    await prisma.$executeRaw`DELETE FROM collys_crews WHERE colly_id = ${id}`;
    for (const crewName of crewNames) {
      await prisma.$executeRaw`
        INSERT IGNORE INTO collys_crews (colly_id, crew_id)
        SELECT ${id}, crews.id FROM crews WHERE crews.name = ${crewName}
      `;
    }
  }

  // Whenever broken state could have changed, ping the moderation badge so
  // it re-fetches its count. Cheap signal — receivers just re-poll.
  if (broken !== undefined) {
    broadcast("site:moderation", { type: "broken-changed", collyId: id, broken });
  }
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);
  const body = deleteParsed.data;

  const rows = await prisma.$queryRaw<{ filename: string; uploader_id: number | null; filesize: number | null }[]>`
    SELECT filename, uploader_id, filesize FROM collys WHERE id = ${body.id}
  `;
  if (!rows[0]) return apiError("Not found", 404);

  const { filename, uploader_id, filesize } = rows[0];
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  const filePath = path.join(collectionsPath, dirname, filename);
  const dizPath = `${filePath}.diz`;

  for (const f of [filePath, dizPath]) {
    try { if (existsSync(f)) unlinkSync(f); } catch { /* ignore */ }
  }

  await prisma.$executeRaw`DELETE FROM comments WHERE colly_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM artists_collys WHERE colly_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM collys_crews WHERE colly_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM favourites WHERE colly_id = ${body.id}`;
  await prisma.$executeRaw`DELETE FROM collys WHERE id = ${body.id}`;

  if (uploader_id && filesize) {
    await prisma.$executeRaw`
      UPDATE users SET uploaded = GREATEST(0, uploaded - ${filesize}) WHERE id = ${uploader_id}
    `;
  }

  return apiOk({ status: true });
}
