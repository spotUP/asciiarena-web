import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const collys = await prisma.collys.findMany({
    orderBy: { timestamp: "desc" },
    take: 20,
    select: { filename: true, name: true, uploader: true, timestamp: true, type: true },
  });

  const items = collys.map((c) => {
    const title = escapeXml(c.name ?? c.filename);
    const link = `${BASE_URL}/release/${escapeXml(c.filename)}`;
    const pubDate = c.timestamp ? new Date(c.timestamp * 1000).toUTCString() : "";
    const description = escapeXml(
      `${c.type ?? "ASCII"} release: ${c.name ?? c.filename}${c.uploader ? ` by ${c.uploader}` : ""}`
    );
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${description}</description>${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>aSCIIaRENA Latest Releases</title>
    <link>${BASE_URL}</link>
    <description>Latest ASCII art releases from aSCIIaRENA</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
