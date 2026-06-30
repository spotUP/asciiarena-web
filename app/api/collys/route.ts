import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
import { broadcast } from "@/lib/live";
import { ensureArtistId, ensureCrewId } from "@/lib/ensureEntity";
import { broadcastActivityIfAllowed } from "@/lib/activity";
import { indexColly } from "@/lib/collyLogoIndex";
import { parseCollyBytes } from "@/lib/collyTrailer";
import { detectCollyType, COLLY_TYPES } from "@/lib/collyType";

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

  const likeParam = filter ? `%${filter}%` : null;

  let rows: CollyRow[];
  let total_count: number;

  if (!likeParam) {
    // No filter: use fast direct query + indexed count (no GROUP BY needed)
    const [dataRows, [countRow]] = await Promise.all([
      prisma.$queryRaw<CollyRow[]>`
        SELECT
          c.id, c.name, c.filename, c.filesize,
          CONCAT(LPAD(c.year,4,0),'-',LPAD(c.month,2,0),'-',LPAD(c.day,2,0)) AS cdate,
          COALESCE((SELECT GROUP_CONCAT(a.nick ORDER BY a.nick SEPARATOR ',')
                    FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id
                    WHERE ac.colly_id = c.id), '') AS artists,
          COALESCE((SELECT GROUP_CONCAT(cr.name ORDER BY cr.name SEPARATOR ',')
                    FROM collys_crews cc JOIN crews cr ON cr.id = cc.crew_id
                    WHERE cc.colly_id = c.id), '') AS crews
        FROM collys c
        ORDER BY ${orderCol} ${orderDir}
        LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
      `,
      prisma.$queryRaw<[{ cnt: bigint }]>`SELECT COUNT(*) AS cnt FROM collys`,
    ]);
    rows = dataRows;
    total_count = Number(countRow?.cnt ?? 0);
  } else {
    // Filtered: GROUP BY + HAVING to match against aggregated artists/crews
    const like = likeParam;
    const [dataRows, countRows] = await Promise.all([
      prisma.$queryRaw<CollyRow[]>`
        SELECT
          c.id, c.name, c.filename, c.filesize,
          CONCAT(LPAD(c.year,4,0),'-',LPAD(c.month,2,0),'-',LPAD(c.day,2,0)) AS cdate,
          COALESCE(GROUP_CONCAT(DISTINCT a.nick ORDER BY a.nick SEPARATOR ','),'') AS artists,
          COALESCE(GROUP_CONCAT(DISTINCT cr.name ORDER BY cr.name SEPARATOR ','),'') AS crews
        FROM collys c
        LEFT JOIN artists_collys ac ON ac.colly_id = c.id
        LEFT JOIN artists a ON a.id = ac.artist_id
        LEFT JOIN collys_crews cc ON cc.colly_id = c.id
        LEFT JOIN crews cr ON cr.id = cc.crew_id
        GROUP BY c.id, c.name, c.filename, c.filesize, c.year, c.month, c.day
        HAVING c.name LIKE ${like} OR c.filename LIKE ${like}
            OR GROUP_CONCAT(DISTINCT cr.name ORDER BY cr.name SEPARATOR ',') LIKE ${like}
            OR GROUP_CONCAT(DISTINCT a.nick ORDER BY a.nick SEPARATOR ',') LIKE ${like}
        ORDER BY ${orderCol} ${orderDir}
        LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS cnt FROM (
          SELECT c.id
          FROM collys c
          LEFT JOIN artists_collys ac ON ac.colly_id = c.id
          LEFT JOIN artists a ON a.id = ac.artist_id
          LEFT JOIN collys_crews cc ON cc.colly_id = c.id
          LEFT JOIN crews cr ON cr.id = cc.crew_id
          GROUP BY c.id, c.name, c.filename
          HAVING c.name LIKE ${like} OR c.filename LIKE ${like}
              OR GROUP_CONCAT(DISTINCT cr.name) LIKE ${like}
              OR GROUP_CONCAT(DISTINCT a.nick) LIKE ${like}
        ) sub
      `,
    ]);
    rows = dataRows;
    total_count = Number(countRows[0]?.cnt ?? 0);
  }

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

  return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Accept either a NextAuth session cookie or a Bearer api_token from CED
  let uploaderNick: string;
  let uploaderId: number;

  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (bearerToken) {
    const tokenRows = await prisma.$queryRaw<[{ id: number; nick: string }]>(
      Prisma.sql`SELECT id, nick FROM users WHERE api_token = ${bearerToken} LIMIT 1`
    );
    const tokenUser = tokenRows[0];
    if (!tokenUser) return apiError("Unauthorized", 401);
    uploaderNick = tokenUser.nick;
    uploaderId = tokenUser.id;
  } else {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    uploaderNick = session.user.name ?? "";
    uploaderId = parseInt(session.user.id);
  }

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
  // If the editor mapped logos, persist them as an invisible Ctrl-Z trailer so the
  // search catalog + renderer use the exact map. Strips any prior trailer first
  // (the editor re-sends the final map). Untouched when no logos were mapped.
  let outBuffer = buffer;
  const logosRaw = String(formData.get("logos") ?? "");
  if (logosRaw) {
    try {
      const logos = JSON.parse(logosRaw) as { line: number; caption: string }[];
      if (Array.isArray(logos) && logos.length) {
        const { visible } = parseCollyBytes(new Uint8Array(bytes));
        const trailer = "\x1a" + logos
          .map((l) => `logo: ${Math.max(1, Math.floor(l.line))} ${String(l.caption).replace(/[\r\n]+/g, " ").slice(0, 120)}`)
          .join("\n") + "\n";
        outBuffer = Buffer.concat([Buffer.from(visible), Buffer.from(trailer, "latin1")]);
      }
    } catch { /* ignore malformed logo map */ }
  }
  await writeFile(filePath, outBuffer);

  // Use the submitter's explicit type when valid, else detect by CONTENT (an
  // ANSI colly saved as .txt is still recognised as ANSI).
  const formType = String(formData.get("type") ?? "").trim().toUpperCase();
  let type = (COLLY_TYPES as string[]).includes(formType)
    ? formType
    : detectCollyType(new Uint8Array(bytes), filename);
  if (type === "ARCHIVE") type = "Archive"; // match the stored convention

  const file_id = filename + ".diz";

  // Per-colly render settings: the submit form wins, else seed from the file's
  // invisible trailer (SAUCE / key:value) so trailer-carrying files self-fill.
  const { meta: trailerMeta } = parseCollyBytes(new Uint8Array(bytes));
  const render_font = (String(formData.get("render_font") ?? "").trim() || trailerMeta.font) || null;
  const render_fg = (String(formData.get("render_fg") ?? "").trim() || trailerMeta.fg) || null;
  const render_bg = (String(formData.get("render_bg") ?? "").trim() || trailerMeta.bg) || null;
  const soundtrack = (String(formData.get("soundtrack") ?? "").trim() || trailerMeta.soundtrack) || null;

  // Insert colly
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO collys (name, filename, type, year, month, day, file_id, filesize, uploader, uploader_id, timestamp, view_counter, downloads, broken, render_font, render_fg, render_bg, soundtrack)
      VALUES (${name}, ${filename}, ${type}, ${year}, ${month}, ${day}, ${file_id}, ${filesize}, ${uploaderNick}, ${uploaderId}, UNIX_TIMESTAMP(), 0, 0, 0, ${render_font}, ${render_fg}, ${render_bg}, ${soundtrack})`
  );

  const insertedRow = await prisma.$queryRaw<[{ rowid: number }]>(
    Prisma.sql`SELECT LAST_INSERT_ID() AS rowid`
  );
  const collyId = insertedRow[0]?.rowid;
  if (!collyId) return apiError("Failed to insert colly", 500);

  // Insert crew relationships — ensure-or-create each named crew so the
  // submitter doesn't have to leave the form to add a missing crew.
  for (const crewname of crewnames) {
    const crewId = await ensureCrewId(crewname);
    if (!crewId) continue;
    await prisma.$executeRaw(
      Prisma.sql`INSERT IGNORE INTO collys_crews (colly_id, crew_id) VALUES (${collyId}, ${crewId})`
    );
  }

  // Insert artist relationships — ensure-or-create each named artist.
  for (const artistname of artistnames) {
    const artistId = await ensureArtistId(artistname);
    if (!artistId) continue;
    await prisma.$executeRaw(
      Prisma.sql`INSERT IGNORE INTO artists_collys (colly_id, artist_id) VALUES (${collyId}, ${artistId})`
    );
  }

  // Index this colly's logo labels for search (non-fatal — never block an
  // upload on indexing, and tolerate the catalog table not existing yet).
  try { await indexColly(collyId, filename, type); } catch { /* ignore */ }

  // Update uploader stats
  await prisma.$executeRaw(
    Prisma.sql`UPDATE users SET uploaded = uploaded + ${filesize} WHERE id = ${uploaderId}`
  );

  revalidateTag("latest-collys", "default");
  // Sidebar widgets cache their data with these tags — bust them so the
  // LiveRefresh subscribers see fresh numbers in addition to the bare re-render.
  revalidateTag("site:stats", "default");
  revalidateTag("site:top-uploaders", "default");
  revalidateTag("site:most-viewed", "default");
  broadcast("site:releases", { type: "posted" });
  await broadcastActivityIfAllowed(uploaderId, "upload", { type: "upload", nick: uploaderNick, target: filename, targetUrl: `/release/${filename}`, timestamp: Math.floor(Date.now() / 1000) });

  // Discord notification
  const releaseUrl = `https://asciiarena.se/release/${urlsafe(filename)}`;
  await notifyDiscord(
    UPLOAD_WEBHOOK,
    `A new ascii collection has just been uploaded to asciiarena.se by ${uploaderNick} named [${name}](${releaseUrl})`
  );

  return apiOk({ status: true }, 201);
}
