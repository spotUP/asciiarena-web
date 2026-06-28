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
      // Skip directories and non-renderable files
      if (name.endsWith("/")) continue;
      const ext = name.toLowerCase().split(".").pop() ?? "";
      if (!["ans", "asc", "txt"].includes(ext)) continue;
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
      const output = execSync(`${LHA_BIN} l "${fp}"`, { encoding: "buffer", timeout: 10000 });
      const listing = output.toString("latin1");
      const files = parseLhaList(listing);
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
    // Strip the first 3 header lines that lha pq prints before the raw file.
    // Work at the byte level — converting through a JS string and back via
    // new Response(string) double-encodes bytes 0x80+ to UTF-8, corrupting
    // ANSI escape sequences (CSI 0x9B becomes C2 9B, etc.).
    let nl = 0, cut = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] === 0x0A) { nl++; if (nl === 3) { cut = i + 1; break; } }
    }
    let content = data.subarray(cut);
    const isAnsi = entry.toLowerCase().endsWith(".ans");

    // Convert 8-bit CSI (0x9B) to 7-bit ESC[ (0x1B 0x5B).
    // AnsiLove only recognises "ESC[" (27, 0x5B), so single-byte CSI
    // codes render as literal text instead of ANSI control sequences.
    if (isAnsi) {
      let csiCount = 0;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === 0x9B) csiCount++;
      }
      if (csiCount > 0) {
        const converted = Buffer.alloc(content.length + csiCount);
        let j = 0;
        for (let i = 0; i < content.length; i++) {
          if (content[i] === 0x9B) {
            converted[j++] = 0x1B;
            converted[j++] = 0x5B;
          } else {
            converted[j++] = content[i];
          }
        }
        content = converted;
      }
    }

    return new Response(content, {
      headers: {
        "Content-Type": isAnsi ? "application/octet-stream" : "text/plain; charset=iso-8859-1",
      },
    });
  } catch (e) {
    return apiError("Failed to extract file: " + String(e), 500);
  }
}
