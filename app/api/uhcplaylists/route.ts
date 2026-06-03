import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { servePlaylistFile } from "@/lib/playlistFile";

interface PlaylistRow {
  filename: string;
  title: string;
  author: string;
  genre: string;
}

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file") ?? "";
  const limit = parseInt(request.nextUrl.searchParams.get("l") ?? "0") || 0;

  if (file) {
    return servePlaylistFile(file);
  }

  const rows = limit > 0
    ? await prisma.$queryRaw<PlaylistRow[]>`
        SELECT filename, title, author, genre FROM hippo_playlists ORDER BY id DESC LIMIT ${limit}
      `
    : await prisma.$queryRaw<PlaylistRow[]>`
        SELECT filename, title, author, genre FROM hippo_playlists ORDER BY id DESC
      `;

  const lines = ["Filename\tPath\tTitle\tAuthor\tGenre"];
  for (const r of rows) {
    lines.push([r.filename, "playlist", r.title, r.author, r.genre].join("\t"));
  }

  // HippoPlayer expects ISO-8859-1. Buffer.from(str, "latin1") maps each char's
  // code point directly to a single byte — equivalent to PHP's utf8_decode().
  const buf = Buffer.from(lines.join("\n") + "\n", "latin1");

  return new Response(buf, {
    headers: { "Content-Type": "text/plain; charset=ISO-8859-1" },
  });
}
