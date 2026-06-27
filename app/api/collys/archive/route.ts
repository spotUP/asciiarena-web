import { NextRequest } from "next/server";
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { apiError, apiOk } from "@/lib/utils";

const LHA_BIN = process.env.LHA_BIN ?? "/usr/bin/lha";
const COLLECTIONS_PATH = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");

function archivePath(filename: string): string {
  const dirname = filename.replace(/\.[^.]+$/, "");
  return path.join(COLLECTIONS_PATH, dirname, filename);
}

/**
 * Parse `lha l` output. Lines look like:
 *  [generic]         1024  2024-01-15  file_id.diz
 *  -rw-r--r--  1234/5678     5678  2024-01-15  art.ans
 */
function parseLhaList(output: string): string[] {
  const files: string[] = [];
  let inListing = false;
  for (const line of output.split("\n")) {
    // Start of the file listing after the header line
    if (line.startsWith("----------")) { inListing = !inListing; continue; }
    if (!inListing) continue;
    // Stop at summary line
    if (line.startsWith(" Total")) break;
    // Match the last whitespace-separated field as the filename (may be a full path)
    const m = line.match(/\s+(\S+)$/);
    if (m) {
      const name = m[1];
      // Skip directories
      if (name.endsWith("/")) continue;
      files.push(name);
    }
  }
  return files;
}

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
      const output = execSync(`${LHA_BIN} l "${fp}"`, { encoding: "utf-8", timeout: 10000 });
      const files = parseLhaList(output);
      return apiOk({ files });
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
    // Strip the first 3 lines which are lha header info (matching PHP: sed 1,3d)
    const text = data.toString("latin1");
    const lines = text.split("\n");
    const content = lines.slice(3).join("\n");
    return new Response(content, {
      headers: { "Content-Type": "text/plain; charset=iso-8859-1" },
    });
  } catch (e) {
    return apiError("Failed to extract file: " + String(e), 500);
  }
}
