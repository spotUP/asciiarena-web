import { prisma } from "@/lib/db";
import { decodePlaylistData } from "@/lib/playlistData";

interface PlaylistFileRow {
  filename: string;
  filedata: string | null;
}

// Serve a shared HippoPlayer playlist (.prg) file by filename. Single source of
// truth for both /playlist/[filename] (the path HippoPlayer actually fetches)
// and the /api/uhcplaylists?file= query form.
export async function servePlaylistFile(file: string): Promise<Response> {
  const rows = await prisma.$queryRaw<PlaylistFileRow[]>`
    SELECT filename, filedata FROM hippo_playlists WHERE filename = ${file} LIMIT 1
  `;
  const row = rows[0];
  if (!row?.filedata) return new Response("Not found", { status: 404 });

  const buf = decodePlaylistData(row.filedata);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.filename}"`,
      "Content-Length": String(buf.length),
      "Cache-Control": "no-cache",
    },
  });
}
