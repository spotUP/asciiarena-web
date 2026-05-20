import { NextRequest } from "next/server";
import { unlinkSync, existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";


interface CollyRow {
  id: number;
  filename: string;
  name: string | null;
  year: number | null;
  month: number | null;
  type: string | null;
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
      SELECT id, filename, name, year, month, type, broken, broken_comment, uploader,
             COUNT(*) OVER() AS total_count
      FROM collys WHERE broken > 0 ORDER BY broken DESC LIMIT 100
    `;
  } else if (q) {
    const like = `%${q}%`;
    rows = await prisma.$queryRaw<CollyRow[]>`
      SELECT id, filename, name, year, month, type, broken, broken_comment, uploader,
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

  const body = await request.json() as {
    id: number;
    name?: string;
    year?: number | null;
    month?: number | null;
    type?: string;
    broken?: number;
    broken_comment?: string | null;
  };

  const { id, name, year, month, type, broken, broken_comment } = body;
  if (!id) return apiError("id required", 400);

  await prisma.$executeRaw`
    UPDATE collys SET
      name = COALESCE(${name ?? null}, name),
      year = COALESCE(${year ?? null}, year),
      month = COALESCE(${month ?? null}, month),
      type = COALESCE(${type ?? null}, type),
      broken = ${broken ?? 0},
      broken_comment = ${broken_comment ?? null}
    WHERE id = ${id}
  `;

  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number };
  if (!body.id) return apiError("id required", 400);

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

  await prisma.$executeRaw`DELETE FROM comments WHERE filename = ${filename}`;
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
