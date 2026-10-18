import { NextRequest } from "next/server";
import { proxyLegacyPlaylist } from "@/lib/playlistProxy";

// HippoPlayer fetches shared playlists from https://asciiarena.se/playlist/<file>
// (the index's Path column is `playlist`). The file lives on hippoplayer.se
// now; pass the request through unchanged.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  return proxyLegacyPlaylist("/playlist/" + encodeURIComponent(decodeURIComponent(filename)));
}
