import { NextRequest } from "next/server";
import { proxyLegacyPlaylist } from "@/lib/playlistProxy";

// Legacy Amiga/UHC playlist index and file feed (/uhcplaylists.php redirects
// here). Served by hippoplayer.se now; passed through unchanged, query and all
// (?l=<n> limits the index, ?file=<name> returns one playlist file).
export async function GET(request: NextRequest) {
  return proxyLegacyPlaylist("/uhcplaylists.php" + request.nextUrl.search);
}
