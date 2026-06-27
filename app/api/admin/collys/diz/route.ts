import { NextRequest } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

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
    // Return raw text for editing (not HTML-escaped)
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      text = new TextDecoder("latin1").decode(bytes);
    }
    return apiOk({ content: text });
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
    writeFileSync(fp, content, "utf-8");
    return apiOk({ status: true });
  } catch (e) {
    return apiError("Failed to write diz file: " + String(e), 500);
  }
}
