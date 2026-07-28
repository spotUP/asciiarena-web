import { NextRequest } from "next/server";
import { existsSync, readFileSync } from "fs";
import { writeFileAtomic } from "@/lib/atomic-write";
import path from "path";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { decodeReleaseText, looksLikeCp437Art } from "@/lib/releaseText";

function dizPath(filename: string): string {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  return path.join(collectionsPath, dirname, `${filename}.diz`);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const filename = request.nextUrl.searchParams.get("filename") ?? "";
  if (!filename) return apiError("filename required", 400);

  const fp = dizPath(filename);
  if (!existsSync(fp)) return apiOk({ content: "" });

  try {
    const bytes = readFileSync(fp);
    // Decode with the same charset logic as the public viewer: PC/CP437 block
    // art is detected by content and decoded as CP437 (block glyphs) instead of
    // Latin-1, which rendered 0xDB/0xDC/0xDF as ÛÜß garbage. Also return the raw
    // bytes (base64) + flag so the editor can preview CP437 art via AnsiLove.
    const content = decodeReleaseText(new Uint8Array(bytes), "auto");
    const cp437 = looksLikeCp437Art(new Uint8Array(bytes));
    return apiOk({ content, cp437, b64: cp437 ? bytes.toString("base64") : null });
  } catch {
    return apiOk({ content: "" });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json().catch(() => ({}));
  const filename = body.filename as string | undefined;
  const content = body.content as string | undefined;
  if (!filename) return apiError("filename required", 400);
  if (content === undefined) return apiError("content required", 400);

  const fp = dizPath(filename);
  try {
    // Atomic + permission-proof: the collections tree is owned by www-data with
    // no group write bit, so writing in place failed with EACCES on every
    // existing .diz. See lib/atomic-write.ts.
    await writeFileAtomic(fp, content);
    return apiOk({ status: true });
  } catch (e) {
    return apiError("Failed to write diz file: " + String(e), 500);
  }
}
