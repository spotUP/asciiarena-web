import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { buildLatestReleaseRowsQuery } from "@/lib/home-latest-releases-query";
import { pickRandomSubset, HERO_POOL_FACTOR } from "@/lib/home-hero-pick";
import { readCollyDiz } from "@/lib/collyDiz";
import { readFileSync, existsSync } from "fs";
import path from "path";

interface ReleaseRow {
  type: string;
  filename: string;
  fyear: number;
  fmonth: number;
  fday: number;
}

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

// Cache both the DB query AND the .diz file reads together for 60s. The
// random variant used ORDER BY RAND() (O(n) on the collys table) and the
// non-random variant still ran 20 fs.existsSync+readFileSync calls per
// render. With cache, every visitor inside the 60s window gets the
// pre-rendered hero in <1ms instead of paying the full I/O tax.
//
// `poolSize` is how many candidates to build, NOT how many to show. The
// random hero asks for a pool and draws from it per request — caching the
// draw itself is what made RANDOM RELEASES show the same two collys to
// everyone until the entry expired.
const getReleasesForHero = unstable_cache(
  async (random: boolean, poolSize: number, collectionsPath: string, magsPath: string, appsPath: string) => {
    let rows: ReleaseRow[] = [];
    try {
      rows = await prisma.$queryRaw<ReleaseRow[]>(buildLatestReleaseRowsQuery(random));
    } catch {
      return [];
    }

    const releases: { url: string; content: string }[] = [];
    for (const row of rows) {
      if (releases.length >= poolSize) break;
      const filename = String(row.filename);
      const dirname = filename.replace(/\.[^.]+$/, "");
      let dizPath = "";
      let url = "";
      if (row.type === "C") {
        dizPath = path.join(collectionsPath, dirname, `${filename}.diz`);
        url = `/release/${filename}`;
      } else if (row.type === "M") {
        dizPath = path.join(magsPath, dirname, `${filename}.diz`);
        url = `/magazine/${filename}`;
      } else if (row.type === "A") {
        const base = filename.replace(/\.[^.]+$/, "");
        dizPath = path.join(appsPath, `${base}.diz`);
        url = `/application/${filename}`;
      }
      // Collys: separate .diz -> embedded diz -> art snippet (ANSI stripped), so
      // fresh uploads without a .diz still appear. Mags/apps: their own .diz.
      const content = row.type === "C" ? readCollyDiz(filename) : readDiz(dizPath);
      if (content) releases.push({ url, content });
    }
    return releases;
  },
  ["latest-releases-hero"],
  // 240s, not 60s: this is the heaviest homepage widget (DB query + up to 20
  // .diz filesystem reads), and it backs BOTH the LATEST and RANDOM hero
  // columns. Revalidating it 4x less often is the single biggest cut to the
  // intermittent homepage render spike; the hero is decorative so 4-minute
  // freshness is fine (the LATEST ADDED COLLYS sidebar covers new releases).
  { revalidate: 240 },
);

export default async function LatestReleasesStatic({ columns = 2, random = false, header = "LATEST RELEASES" }: {
  columns?: number;
  random?: boolean;
  header?: string;
}) {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const magsPath = process.env.MAGS_PATH ?? path.join(process.cwd(), "mags");
  const appsPath = process.env.APPS_PATH ?? path.join(process.cwd(), "apps");
  // LATEST needs exactly the columns it shows (they are ordered). RANDOM caches
  // a wider pool and draws from it on every render, so the hero changes on
  // refresh instead of freezing for the whole cache window.
  const poolSize = random ? columns * HERO_POOL_FACTOR : columns;
  const pool = await getReleasesForHero(random, poolSize, collectionsPath, magsPath, appsPath);
  const releases = random ? pickRandomSubset(pool, columns) : pool.slice(0, columns);

  const colSize = Math.round(12 / columns);

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header w-100 col-12">
        <h2 className="ap-1 am-0 bg-header">{header}</h2>
      </div>
      <div className="row m-0 p-0">
        {releases.map(({ url, content }) => (
          <div
            key={url}
            className={`col-12 d-flex justify-content-center align-items-center col-xl-${colSize} overflow-hidden apt-1 apb-1`}
          >
            <div className="row animate__animated animate__backInUp">
              <pre>
                {/* Next <Link> = client-side nav, so background music keeps
                    playing across the colly click (a plain <a> full-reloads). */}
                <Link prefetch={false} href={url} className="ascii magenta" dangerouslySetInnerHTML={{ __html: content }} />
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
