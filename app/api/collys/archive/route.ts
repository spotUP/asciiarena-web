import { NextRequest } from "next/server";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { LHA_BIN, archivePath, parseLhaList, normalizeCsi } from "@/lib/archive";
import { getHiddenEntries } from "@/lib/archiveHidden";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filename = searchParams.get("filename") ?? "";
  const entry = searchParams.get("entry") ?? "";

  if (!filename) return apiError("filename required", 400);

  const fp = archivePath(filename);
  if (!existsSync(fp)) return apiError("Archive not found", 404);

  // List files in archive
  if (!entry) {
    try {
      const output = execSync(`${LHA_BIN} l "${fp}"`, { encoding: "buffer", timeout: 10000 });
      const listing = output.toString("latin1");
      const files = parseLhaList(listing);
      const hidden = getHiddenEntries(filename);
      // Admins see every entry (with the hidden ones flagged so they can
      // unhide); everyone else only sees the entries that aren't hidden.
      const session = await auth();
      const isAdmin = (session?.user as { rank?: string } | undefined)?.rank === "Admin";
      if (isAdmin) return apiOk({ files, hidden });
      return apiOk({ files: files.filter(f => !hidden.includes(f)) });
    } catch (e) {
      return apiError("Failed to list archive: " + String(e), 500);
    }
  }

  // Extract and serve a single file
  try {
    const data = execSync(`${LHA_BIN} pq "${fp}" "${entry}"`, {
      encoding: "buffer",
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024, // 10MB max
    });
    // `lha pq` (quiet) emits the raw file with no header to strip. Normalise
    // 8-bit CSI (0x9B) to ESC[ so AnsiLove renders the control codes as colour
    // instead of literal text. Work at the byte level — round-tripping through
    // a JS string double-encodes bytes 0x80+ to UTF-8 and corrupts CP437/ANSI.
    const content = normalizeCsi(data);

    return new Response(new Uint8Array(content), {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch (e) {
    return apiError("Failed to extract file: " + String(e), 500);
  }
}
