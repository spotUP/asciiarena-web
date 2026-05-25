import { readFileSync, existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ReleaseRow { type: string; filename: string }

function readDiz(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath);
    return raw.toString("latin1")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  } catch {
    return null;
  }
}

export async function GET() {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");

  let rows: ReleaseRow[] = [];
  try {
    rows = await prisma.$queryRaw<ReleaseRow[]>(Prisma.sql`
      SELECT 'C' AS type, filename
      FROM collys
      ORDER BY year DESC, month DESC, day DESC
      LIMIT 20
    `);
  } catch {
    return apiOk([]);
  }

  const releases: { url: string; content: string }[] = [];
  for (const row of rows) {
    if (releases.length >= 2) break;
    const filename = String(row.filename);
    const dirname = filename.replace(/\.[^.]+$/, "");
    const dizPath = path.join(collectionsPath, dirname, `${filename}.diz`);
    const content = readDiz(dizPath);
    if (content) releases.push({ url: `/release/${filename}`, content });
  }

  return apiOk(releases);
}
