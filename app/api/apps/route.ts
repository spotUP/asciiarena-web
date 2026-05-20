import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, notifyDiscord, UPLOAD_WEBHOOK, safeSort, APP_SORT_COLS } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

interface AppRow {
  id: number;
  name: string | null;
  filename: string | null;
  filesize: number | null;
  author: string | null;
  timestamp: number | null;
}

interface CountRow {
  cnt: bigint | number;
}

function formatTimestamp(ts: number | null): string {
  if (ts == null) return "";
  const d = new Date(ts * 1000);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

const ALLOWED_EXTENSIONS = new Set([".lha", ".txt", ".dms", ".lzh", ".zip"]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesizeRaw = parseInt(searchParams.get("pagesize") ?? "25") || 25;
  const pagesize = Math.min(Math.max(1, pagesizeRaw), 200);
  const sortCol = safeSort(searchParams.get("sort") ?? "name", APP_SORT_COLS, "name");
  const ascending = (searchParams.get("asc") ?? "") === "A";
  const filter = searchParams.get("filter") ?? "";

  const startInt = Math.max(0, (page - 1) * pagesize);
  const pagesizeInt = pagesize;

  const orderDir = Prisma.raw(ascending ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  const likeParam = filter ? `%${filter}%` : "%";

  const rows = await prisma.$queryRaw<AppRow[]>`
    SELECT *
    FROM apps
    WHERE name LIKE ${likeParam} OR filename LIKE ${likeParam} OR author LIKE ${likeParam}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
  `;

  const countRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS cnt
    FROM apps
    WHERE name LIKE ${likeParam} OR filename LIKE ${likeParam} OR author LIKE ${likeParam}
  `;

  const total_count = Number(countRows[0]?.cnt ?? 0);

  const result = rows.map((row) => ({
    url: `/application/${row.filename ?? ""}`,
    id: Number(row.id),
    name: row.name,
    filesize: row.filesize !== null ? Number(row.filesize) : null,
    filename: row.filename,
    author: row.author,
    timestamp: formatTimestamp(row.timestamp),
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

  const fileField = formData.get("file");
  if (!(fileField instanceof File)) return apiError("Missing file", 400);

  const file = fileField;
  const filename = file.name;
  const name = String(formData.get("name") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const year = parseInt(String(formData.get("year") ?? "1900")) || 1900;
  const month = parseInt(String(formData.get("month") ?? "1")) || 1;
  const day = parseInt(String(formData.get("day") ?? "1")) || 1;

  // Extension check
  const extDotIdx = filename.lastIndexOf(".");
  const ext = extDotIdx >= 0 ? filename.slice(extDotIdx).toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return apiError(
      "This filetype is not allowed here. Only LHA, LZH, DMS, ZIP and TXT are accepted.",
      400
    );
  }

  // Uniqueness check
  const dupCheck = await prisma.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT count(*) AS cnt FROM apps WHERE name = ${name} OR filename = ${filename}`
  );
  if (Number(dupCheck[0]?.cnt ?? 0) > 0) {
    return apiError("An app with that name or filename already exists", 409);
  }

  // File size limit: 10 MB
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filesize = buffer.byteLength;
  if (filesize > 10_240_000) {
    return apiError("The file is too large, contact an admin to upload this file", 400);
  }

  // Save file
  const appsPath = process.env.APPS_PATH ?? "apps";
  if (!existsSync(appsPath)) {
    await mkdir(appsPath, { recursive: true });
  }
  const filePath = path.join(appsPath, filename);
  await writeFile(filePath, buffer);

  const file_id = filename + ".diz";
  const uploaderNick = session.user.name ?? "";
  const uploaderId = parseInt(session.user.id);

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO apps (name, filename, filedate, timestamp, author, filesize, uploader_id, uploader, view_counter, downloads, file_id, year, month, day)
      VALUES (${name}, ${filename}, NULL, UNIX_TIMESTAMP(), ${author}, ${filesize}, ${uploaderId}, ${uploaderNick}, 0, 0, ${file_id}, ${year}, ${month}, ${day})`
  );

  // Update uploader stats
  await prisma.$executeRaw(
    Prisma.sql`UPDATE users SET uploaded = uploaded + ${filesize} WHERE id = ${uploaderId}`
  );

  // Discord notification
  const appUrl = `https://asciiarena.se/application/${filename}`;
  await notifyDiscord(
    UPLOAD_WEBHOOK,
    `A new application has just been uploaded to asciiarena.se by ${uploaderNick} named [${name}](${appUrl})`
  );

  return apiOk({ status: true }, 201);
}
