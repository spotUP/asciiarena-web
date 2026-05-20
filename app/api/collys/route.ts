import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  apiError,
  apiOk,
  urlsafe,
  notifyDiscord,
  UPLOAD_WEBHOOK,
  safeSort,
  COLLY_SORT_COLS,
} from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

interface CollyRow {
  id: number;
  name: string | null;
  filename: string;
  filesize: number | null;
  artists: string;
  crews: string;
  cdate: string;
}

interface CountRow {
  cnt: bigint | number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = (request as { nextUrl?: URL }).nextUrl ?? new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesizeRaw = parseInt(searchParams.get("pagesize") ?? "25") || 25;
  const pagesize = Math.min(Math.max(1, pagesizeRaw), 200);
  const sortCol = safeSort(searchParams.get("sort") ?? "name", COLLY_SORT_COLS, "name");
  const ascending = (searchParams.get("asc") ?? "") === "A";
  const filter = searchParams.get("filter") ?? "";

  const startInt = Math.max(0, (page - 1) * pagesize);
  const pagesizeInt = pagesize;

  const orderDir = Prisma.raw(ascending ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  const likeParam = filter ? `%${filter}%` : "%";

  const filterClause = Prisma.sql`HAVING name LIKE ${likeParam} OR filename LIKE ${likeParam} OR crews LIKE ${likeParam} OR artists LIKE ${likeParam}`;

  const rows = await prisma.$queryRaw<CollyRow[]>`
    SELECT
      c.id,
      c.name,
      c.filename,
      c.filesize,
      concat(lpad(c.year,4,0),'-',lpad(c.month,2,0),'-',lpad(c.day,2,0)) AS cdate,
      (SELECT coalesce(GROUP_CONCAT(a.nick),'') FROM artists_collys ac LEFT JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = c.id) AS artists,
      (SELECT coalesce(GROUP_CONCAT(cr.name),'') FROM collys_crews cc LEFT JOIN crews cr ON cr.id = cc.crew_id WHERE cc.colly_id = c.id) AS crews
    FROM collys c
    ${filterClause}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
  `;

  const countRows = await prisma.$queryRaw<CountRow[]>`
    SELECT count(c.id) AS cnt
    FROM (
      SELECT
        c.*,
        (SELECT coalesce(GROUP_CONCAT(a.nick),'') FROM artists_collys ac LEFT JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = c.id) AS artists,
        (SELECT coalesce(GROUP_CONCAT(cr.name),'') FROM collys_crews cc LEFT JOIN crews cr ON cr.id = cc.crew_id WHERE cc.colly_id = c.id) AS crews
      FROM collys c
      HAVING name LIKE ${likeParam} OR filename LIKE ${likeParam} OR crews LIKE ${likeParam} OR artists LIKE ${likeParam}
    ) c
  `;

  const total_count = Number(countRows[0]?.cnt ?? 0);

  const result = rows.map((row) => ({
    url: `/release/${row.filename}`,
    id: Number(row.id),
    name: row.name,
    filename: row.filename,
    filesize: row.filesize !== null ? Number(row.filesize) : null,
    artists: row.artists,
    crews: row.crews,
    cdate: row.cdate,
    total_count,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Invalid form data", 400);
  }

  const fileField = formData.get("filename");
  if (!(fileField instanceof File)) return apiError("Missing file", 400);

  const file = fileField;
  const filename = file.name;
  const name = String(formData.get("name") ?? "").trim();
  const year = parseInt(String(formData.get("year") ?? "1900")) || 1900;
  const month = parseInt(String(formData.get("month") ?? "1")) || 1;
  const day = parseInt(String(formData.get("day") ?? "1")) || 1;
  const crewnames = formData.getAll("crewname[]").map((v) => String(v)).filter(Boolean);
  const artistnames = formData.getAll("artistname[]").map((v) => String(v)).filter(Boolean);

  // Duplicate check
  const dupCheck = await prisma.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT count(*) AS cnt FROM collys WHERE name = ${name} OR filename = ${filename}`
  );
  if (Number(dupCheck[0]?.cnt ?? 0) > 0) {
    return apiError("A colly with that name or filename already exists", 409);
  }

  // File size limit: 10 MB
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filesize = buffer.byteLength;
  if (filesize > 10_240_000) {
    return apiError("The file is too large, contact an admin to upload this file", 400);
  }

  // Resolve upload path
  const collectionsPath = process.env.COLLECTIONS_PATH ?? "collections";
  const extDotIdx = filename.lastIndexOf(".");
  const ext = extDotIdx >= 0 ? filename.slice(extDotIdx + 1).toLowerCase() : "";
  const dirname = extDotIdx >= 0 ? filename.slice(0, extDotIdx) : filename;
  const uploadDir = path.join(collectionsPath, dirname);
  const filePath = path.join(uploadDir, filename);

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  await writeFile(filePath, buffer);

  // Detect type
  let type = "ASCII";
  if (ext === "ans") {
    type = "ANSI";
  } else if (["dms", "lzh", "lha", "zip"].includes(ext)) {
    type = "Archive";
  }

  const file_id = filename + ".diz";
  const uploaderNick = session.user.name ?? "";
  const uploaderId = parseInt(session.user.id);

  // Insert colly
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO collys (name, filename, type, year, month, day, file_id, filesize, uploader, uploader_id, timestamp, view_counter, downloads, broken)
      VALUES (${name}, ${filename}, ${type}, ${year}, ${month}, ${day}, ${file_id}, ${filesize}, ${uploaderNick}, ${uploaderId}, UNIX_TIMESTAMP(), 0, 0, 0)`
  );

  const insertedRow = await prisma.$queryRaw<[{ rowid: number }]>(
    Prisma.sql`SELECT LAST_INSERT_ID() AS rowid`
  );
  const collyId = insertedRow[0]?.rowid;
  if (!collyId) return apiError("Failed to insert colly", 500);

  // Insert crew relationships
  for (const crewname of crewnames) {
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO collys_crews (colly_id, crew_id)
        SELECT ${collyId}, id FROM crews
        WHERE name = ${crewname}
          AND (SELECT count(*) FROM collys_crews WHERE colly_id = ${collyId} AND crew_id = crews.id) = 0`
    );
  }

  // Insert artist relationships
  for (const artistname of artistnames) {
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO artists_collys (colly_id, artist_id)
        SELECT ${collyId}, id FROM artists
        WHERE nick = ${artistname}
          AND (SELECT count(*) FROM artists_collys WHERE colly_id = ${collyId} AND artist_id = artists.id) = 0`
    );
  }

  // Update uploader stats
  await prisma.$executeRaw(
    Prisma.sql`UPDATE users SET uploaded = uploaded + ${filesize} WHERE id = ${uploaderId}`
  );

  // Discord notification
  const releaseUrl = `https://asciiarena.se/release/${urlsafe(filename)}`;
  await notifyDiscord(
    UPLOAD_WEBHOOK,
    `A new ascii collection has just been uploaded to asciiarena.se by ${uploaderNick} named [${name}](${releaseUrl})`
  );

  return apiOk({ status: true }, 201);
}
