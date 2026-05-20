import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

interface PlaylistRow {
  filename: string;
  title: string;
  author: string;
  genre: string;
  filedata: string | null;
}

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file") ?? "";
  const limit = parseInt(request.nextUrl.searchParams.get("l") ?? "0") || 0;

  if (file) {
    const rows = await prisma.$queryRaw<PlaylistRow[]>`
      SELECT filename, filedata FROM hippo_playlists WHERE filename = ${file} LIMIT 1
    `;
    const row = rows[0];
    if (!row?.filedata) return new Response("Not found", { status: 404 });

    const base64 = row.filedata.replace("data:application/octet-stream;base64,", "");
    const buf = Buffer.from(base64, "base64");

    return new Response(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${row.filename}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "no-cache",
      },
    });
  }

  const rows = limit > 0
    ? await prisma.$queryRawUnsafe<PlaylistRow[]>(
        `SELECT filename, title, author, genre FROM hippo_playlists ORDER BY id DESC LIMIT ${limit}`
      )
    : await prisma.$queryRaw<PlaylistRow[]>`
        SELECT filename, title, author, genre FROM hippo_playlists ORDER BY id DESC
      `;

  const lines = ["Filename\tPath\tTitle\tAuthor\tGenre"];
  for (const r of rows) {
    lines.push([r.filename, "playlist", r.title, r.author, r.genre].join("\t"));
  }

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
