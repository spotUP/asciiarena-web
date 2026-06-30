import { z } from "zod";
import { NextRequest } from "next/server";
import { unlinkSync, existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { loadEntityDicts } from "@/lib/collyLogoIndex";

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
  // Render settings (parity with the submit form). Always sent by the admin UI;
  // empty -> null clears the per-colly override (falls back to viewer/default).
  render_font: z.string().max(32).nullable().optional(),
  render_fg: z.string().max(15).nullable().optional(),
  render_bg: z.string().max(15).nullable().optional(),
  soundtrack: z.string().max(255).nullable().optional(),
  // Logo map (visual editor). When present, replaces the colly's catalog rows
  // with this manual map (drives rendering + search), like a mapped upload.
  logos: z.array(z.object({
    line: z.number().int().positive(),
    end: z.number().int().positive().optional(),
    caption: z.string().max(200),
  })).optional(),
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
  render_font: string | null;
  render_fg: string | null;
  render_bg: string | null;
  soundtrack: string | null;
  total_count: bigint;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const broken = searchParams.get("broken") === "1";

  // Saved logo map for one colly (manual rows) -> the visual editor seeds from this.
  const logosId = Number(searchParams.get("logos") ?? "");
  if (Number.isFinite(logosId) && logosId > 0) {
    const rows = await prisma.colly_logos.findMany({
      where: { colly_id: logosId, manual: 1 },
      orderBy: { position: "asc" },
      select: { start_line: true, end_line: true, label: true },
    });
    return apiOk(rows.map((r) => ({
      line: r.start_line + 1,
      end: r.end_line != null ? r.end_line + 1 : undefined,
      caption: r.label,
    })));
  }

  let rows: CollyRow[];

  if (broken) {
    rows = await prisma.$queryRaw<CollyRow[]>`
      SELECT id, filename, name, year, month, day, type, file_id, broken, broken_comment, uploader,
             render_font, render_fg, render_bg, soundtrack,
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
             render_font, render_fg, render_bg, soundtrack,
             (SELECT GROUP_CONCAT(a.nick ORDER BY a.nick SEPARATOR ', ')
              FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id
              WHERE ac.colly_id = c.id) AS artists,
             (SELECT GROUP_CONCAT(cr.name ORDER BY cr.name SEPARATOR ', ')
              FROM collys_crews cc JOIN crews cr ON cr.id = cc.crew_id
              WHERE cc.colly_id = c.id) AS crews,
             COUNT(*) OVER() AS total_count
      FROM collys c WHERE filename LIKE ${like} OR name LIKE ${like}
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
  const { id, filename, name, year, month, day, type, file_id, artistNames, crewNames, broken, broken_comment, render_font, render_fg, render_bg, soundtrack, logos } = patchParsed.data;

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

  // Render fields are direct-assigned, so an empty value clears the per-colly
  // override (falls back to viewer/default). Only touched when the field is
  // present in the payload, so partial PATCHes (e.g. the broken toggle) never
  // wipe them. "" -> null = cleared.
  if (render_font !== undefined) await prisma.$executeRaw`UPDATE collys SET render_font = ${render_font || null} WHERE id = ${id}`;
  if (render_fg !== undefined) await prisma.$executeRaw`UPDATE collys SET render_fg = ${render_fg || null} WHERE id = ${id}`;
  if (render_bg !== undefined) await prisma.$executeRaw`UPDATE collys SET render_bg = ${render_bg || null} WHERE id = ${id}`;
  if (soundtrack !== undefined) await prisma.$executeRaw`UPDATE collys SET soundtrack = ${soundtrack || null} WHERE id = ${id}`;

  // Logo map: replace the colly's catalog rows with the edited manual map,
  // exactly like a mapped upload (manual rows drive rendering + search).
  if (logos) {
    const rows = buildLogoRowsFromMap(id, logos, await loadEntityDicts());
    await prisma.colly_logos.deleteMany({ where: { colly_id: id } });
    if (rows.length) await prisma.colly_logos.createMany({ data: rows.map((r) => ({ ...r, manual: 1 })) });
  }

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
