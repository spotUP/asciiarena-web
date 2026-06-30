// One-off backfill: build the colly_logos catalog from every colly on disk.
//
// Run on the server (it needs DATABASE_URL + COLLECTIONS_PATH), from the app
// root, after the colly_logos table exists:
//
//   npx tsx scripts/backfill-colly-logos.ts
//
// Idempotent — safe to re-run (each colly's rows are replaced). Reads files,
// persists only extracted labels.
import { readFileSync } from "fs";

// Load env from the app's .env so DATABASE_URL / COLLECTIONS_PATH are available
// when run manually (systemd injects them for the service, not for a shell run).
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* file may not exist */
  }
}

const { prisma } = await import("@/lib/db");
const { indexColly, loadEntityDicts } = await import("@/lib/collyLogoIndex");

async function main() {
  const dicts = await loadEntityDicts();
  console.log(`entities: artists=${dicts.artists.length} crews=${dicts.crews.length} users=${dicts.users.length}`);

  const BATCH = 200;
  let offset = 0;
  let collys = 0;
  let withLogos = 0;
  let logos = 0;
  let resolved = 0;

  for (;;) {
    const batch = await prisma.collys.findMany({
      select: { id: true, filename: true, type: true },
      orderBy: { id: "asc" },
      skip: offset,
      take: BATCH,
    });
    if (!batch.length) break;
    for (const c of batch) {
      try {
        const r = await indexColly(c.id, c.filename, c.type, dicts);
        collys++;
        logos += r.logos;
        resolved += r.resolved;
        if (r.logos) withLogos++;
      } catch (e) {
        console.error(`  ! ${c.filename}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    offset += batch.length;
    console.log(`...${collys} collys scanned, ${logos} logos (${resolved} resolved)`);
  }

  console.log(
    `DONE: ${collys} collys (${withLogos} with captioned logos), ${logos} logos indexed, ${resolved} resolved to an entity`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
