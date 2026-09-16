// One-time import: Demozoo BBS text ads into asciiarena's bbs_ads table.
//
// Source: JSONL exported from the doorserver corpus -
//   (doorserver) npx tsx scripts/export-bbs-ads.ts --out /tmp/bbs_ads.jsonl
// Import (needs DATABASE_URL; the bbs_ads_migration.sql table must exist):
//   npx tsx scripts/import-bbs-ads.ts --file /tmp/bbs_ads.jsonl [--dry] [--limit N]
//
// Matching, in order: existing demozoo_id link, normalized name, else create
// a bbses row (demozoo_id set, country/software left for the review pass).
// Ambiguous duplicates are NEVER merged - reported for a human. Idempotent:
// existing demozoo_ad_id rows are skipped, so re-running is safe.
import { readFileSync } from "fs";

// Load env from the app's .env so DATABASE_URL is available
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

import { normalizeBbsName, matchBbs } from "../lib/bbsAdMatch";

const { prisma } = await import("@/lib/db");

interface AdRow {
  ad_id: number;
  filename: string;
  filesize: number;
  text: string;
  encoding: string | null;
  is_ansi: number;
  phones: string[];
  nodes: number | null;
  handles: string[];
  groups: string[];
  page_url: string;
  bbs_id: number;
  bbs_name: string;
}

function args(): { file: string; dry: boolean; limit: number } {
  const a = process.argv.slice(2);
  const get = (n: string): string | null => {
    const i = a.indexOf(n);
    return i >= 0 && i + 1 < a.length ? a[i + 1] : null;
  };
  return {
    file: get("--file") ?? "/tmp/bbs_ads.jsonl",
    dry: a.includes("--dry"),
    limit: get("--limit") ? Number(get("--limit")) : Infinity,
  };
}

async function main(): Promise<void> {
  const { file, dry, limit } = args();
  const rows = readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as AdRow);
  console.log(`ad rows: ${rows.length}`);

  const existing = await prisma.bbses.findMany({ select: { id: true, name: true, demozoo_id: true } });
  const candidates = existing.map((c) => ({ ...c }));
  const seenAds = new Set(
    (await prisma.bbs_ads.findMany({ select: { demozoo_ad_id: true } })).map((r) => r.demozoo_ad_id)
  );
  console.log(`bbses rows: ${candidates.length}, ads already stored: ${seenAds.size}`);

  let matched = 0;
  let created = 0;
  let ambiguous = 0;
  let inserted = 0;
  let skipped = 0;
  const missSample: string[] = [];
  const ambiguousSample: string[] = [];
  const pending: {
    bbs_id: number;
    demozoo_ad_id: number;
    filename: string;
    filesize: number | null;
    content: string;
    encoding: string | null;
    is_ansi: boolean;
    phones_json: string;
    nodes: number | null;
    handles_json: string;
    groups_json: string;
    page_url: string | null;
  }[] = [];

  for (const r of rows.slice(0, limit)) {
    if (seenAds.has(r.ad_id)) {
      skipped++;
      continue;
    }
    const m = matchBbs(r.bbs_id, r.bbs_name, candidates);
    let bbsId: number | null = null;
    if (m.kind === "demozoo_id" || m.kind === "name") {
      matched++;
      bbsId = m.id;
    } else if (m.kind === "ambiguous") {
      ambiguous++;
      if (ambiguousSample.length < 10) ambiguousSample.push(`${r.bbs_name} -> [${m.ids.join(",")}]`);
      continue;
    } else {
      if (missSample.length < 10) missSample.push(`${r.bbs_id}: ${r.bbs_name} (norm: ${normalizeBbsName(r.bbs_name)})`);
      if (!dry) {
        const created_row = await prisma.bbses.create({
          data: { name: r.bbs_name.slice(0, 60), demozoo_id: r.bbs_id },
          select: { id: true },
        });
        candidates.push({ id: created_row.id, name: r.bbs_name, demozoo_id: r.bbs_id });
        bbsId = created_row.id;
      } else {
        bbsId = -1;
      }
      created++;
    }
    pending.push({
      bbs_id: bbsId,
      demozoo_ad_id: r.ad_id,
      filename: r.filename.slice(0, 255),
      filesize: r.filesize,
      content: r.text,
      encoding: r.encoding,
      is_ansi: r.is_ansi === 1,
      phones_json: JSON.stringify(r.phones),
      nodes: r.nodes,
      handles_json: JSON.stringify(r.handles),
      groups_json: JSON.stringify(r.groups),
      page_url: r.page_url?.slice(0, 255) ?? null,
    });
    if (!dry && pending.length >= 500) {
      await prisma.bbs_ads.createMany({ data: pending.splice(0) });
    }
  }
  if (!dry && pending.length > 0) {
    await prisma.bbs_ads.createMany({ data: pending.splice(0) });
  }
  if (!dry) {
    const now = await prisma.bbs_ads.count();
    inserted = now - seenAds.size;
    console.log(`stored ads now: ${now} (inserted ~${inserted})`);
  }
  console.log(
    `${dry ? "DRY " : ""}matched=${matched} created=${created} ambiguous=${ambiguous} skipped=${skipped} pending_rows=${pending.length}`
  );
  if (missSample.length > 0) console.log(`create sample:\n  ${missSample.join("\n  ")}`);
  if (ambiguousSample.length > 0) console.log(`ambiguous sample:\n  ${ambiguousSample.join("\n  ")}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
