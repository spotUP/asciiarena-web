import { NextRequest } from "next/server";
import { servePlaylistFile } from "@/lib/playlistFile";

// HippoPlayer fetches shared playlists from https://asciiarena.se/playlist/<file>.
// This was previously a next.config rewrite to /api/uhcplaylists?file=:filename,
// but the rewrite did not forward the query param — the route saw no `file` and
// returned the index listing instead of the file, so HippoPlayer reported
// "not a playlist". A real dynamic route reads the filename straight from the
// path, which is reliable.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  return servePlaylistFile(decodeURIComponent(filename));
}
