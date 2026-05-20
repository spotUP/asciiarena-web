import { NextRequest } from "next/server";
import { existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";

interface CollyRow {
  filename: string;
  name: string | null;
  artists: string | null;
  crews: string | null;
}

export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get("l") ?? "0") || 0;
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");

  const rows = limit > 0
    ? await prisma.$queryRawUnsafe<CollyRow[]>(`
        SELECT co.filename, co.name,
          (SELECT GROUP_CONCAT(a.nick) FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = co.id) AS artists,
          (SELECT GROUP_CONCAT(c.name) FROM collys_crews cc JOIN crews c ON c.id = cc.crew_id WHERE cc.colly_id = co.id) AS crews
        FROM collys co ORDER BY co.id DESC LIMIT ${limit}
      `)
    : await prisma.$queryRaw<CollyRow[]>`
        SELECT co.filename, co.name,
          (SELECT GROUP_CONCAT(a.nick) FROM artists_collys ac JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = co.id) AS artists,
          (SELECT GROUP_CONCAT(c.name) FROM collys_crews cc JOIN crews c ON c.id = cc.crew_id WHERE cc.colly_id = co.id) AS crews
        FROM collys co ORDER BY co.id DESC
      `;

  const TAB = "\t";
  const NL = "\n";

  const lines = ["Filename\tPath\tArtist(s)\tCrew(s)\tDescription"];

  for (const r of rows) {
    if (!r.filename) continue;
    const dirname = r.filename.replace(/\.[^.]+$/, "");
    const filePath = path.join(collectionsPath, dirname, r.filename);
    if (!existsSync(filePath)) continue;
    lines.push(
      [r.filename, `collections/${dirname}`, r.artists ?? "", r.crews ?? "", r.name ?? ""].join(TAB)
    );
  }

  return new Response(lines.join(NL) + NL, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
