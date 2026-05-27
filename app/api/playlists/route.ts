import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";

const postSchema = z.object({
  title: z.string().min(1).max(500),
  filename: z.string().min(1).max(255),
  author: z.string().max(255).optional(),
  genre: z.string().max(255).optional(),
  filedata: z.string().optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

const SORT_COLS: Record<string, string> = {
  title: "title",
  genre: "genre",
  uploaddate: "uploaddate",
};

interface PlaylistRow {
  id: number;
  title: string;
  author: string;
  genre: string;
  filename: string;
  uploaddate: number;
  total_count: bigint;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return apiError("Forbidden", 403);
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesize = Math.max(1, Math.min(200, parseInt(searchParams.get("pagesize") ?? "120") || 120));
  const sortKey = searchParams.get("sort") ?? "uploaddate";
  const sortCol = SORT_COLS[sortKey] ?? "uploaddate";
  const asc = searchParams.get("asc") === "A";
  const filter = searchParams.get("filter") ?? "";
  const offset = (page - 1) * pagesize;

  const orderDir = Prisma.raw(asc ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  let rows: PlaylistRow[];

  if (filter) {
    const like = `%${filter}%`;
    rows = await prisma.$queryRaw<PlaylistRow[]>`
      SELECT id, title, author, genre, filename, uploaddate, COUNT(*) OVER() AS total_count
      FROM hippo_playlists
      WHERE title LIKE ${like} OR genre LIKE ${like} OR author LIKE ${like}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
    `;
  } else {
    rows = await prisma.$queryRaw<PlaylistRow[]>`
      SELECT id, title, author, genre, filename, uploaddate, COUNT(*) OVER() AS total_count
      FROM hippo_playlists
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
    `;
  }

  return apiOk(rows.map(r => ({
    id: r.id,
    title: r.title,
    author: r.author,
    genre: r.genre,
    filename: r.filename,
    uploaddate: r.uploaddate
      ? new Date(r.uploaddate * 1000).toISOString().slice(0, 10)
      : "-",
    total_count: Number(r.total_count),
  })));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { title, author, genre, filename, filedata } = parsed.data;

  await prisma.$executeRaw`
    INSERT INTO hippo_playlists (title, author, genre, filename, filedata, uploaddate)
    VALUES (${title ?? ""}, ${author ?? ""}, ${genre ?? ""}, ${filename}, ${filedata ?? null}, UNIX_TIMESTAMP())
  `;

  broadcast("site:playlists", { type: "added", title, filename });
  return apiOk({ status: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const parsedDelete = deleteSchema.safeParse(rawDeleteBody);
  if (!parsedDelete.success) return apiError("Invalid request: " + parsedDelete.error.issues[0]?.message, 400);

  await prisma.$executeRaw`DELETE FROM hippo_playlists WHERE id = ${parsedDelete.data.id}`;
  return apiOk({ status: true });
}
