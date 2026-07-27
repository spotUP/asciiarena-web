import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { buildLatestReleaseRowsQuery } from "@/lib/home-latest-releases-query";
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

// Builds the hero: one sample of releases (random, or newest-first), resolved
// to renderable .diz content. Stops as soon as `count` entries have content,
// so a run of releases without a .diz costs a few extra reads, not 20.
async function buildHero(random: boolean, count: number, collectionsPath: string, magsPath: string, appsPath: string) {
  let rows: ReleaseRow[] = [];
  try {
    rows = await prisma.$queryRaw<ReleaseRow[]>(buildLatestReleaseRowsQuery(random));
  } catch {
    return [];
  }

  const releases: { url: string; content: string }[] = [];
  for (const row of rows) {
    if (releases.length >= count) break;
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
}

// LATEST is deterministic, so caching costs nothing in freshness: every visitor
// inside the window gets the pre-rendered hero instead of paying for the DB
// query plus the .diz reads. 240s is fine — the LATEST ADDED COLLYS sidebar
// covers genuinely new releases.
const getLatestReleasesForHero = unstable_cache(
  async (count: number, collectionsPath: string, magsPath: string, appsPath: string) =>
    buildHero(false, count, collectionsPath, magsPath, appsPath),
  ["latest-releases-hero"],
  { revalidate: 240 },
);

// RANDOM is deliberately NOT cached, at any layer. Caching the query caches the
// pick, and a cached pick is not random — that is what made this widget show
// the same two collys on every refresh. Caching a wider pool and drawing from
// it per request has the same flaw, just with a longer repeat cycle. ORDER BY
// RAND() over ~4k rows projecting four small columns costs about a
// millisecond, and only the collys actually shown are read off disk.
// Do not wrap this in unstable_cache.

export default async function LatestReleasesStatic({ columns = 2, random = false, header = "LATEST RELEASES" }: {
  columns?: number;
  random?: boolean;
  header?: string;
}) {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const magsPath = process.env.MAGS_PATH ?? path.join(process.cwd(), "mags");
  const appsPath = process.env.APPS_PATH ?? path.join(process.cwd(), "apps");
  const releases = random
    ? await buildHero(true, columns, collectionsPath, magsPath, appsPath)
    : await getLatestReleasesForHero(columns, collectionsPath, magsPath, appsPath);

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
