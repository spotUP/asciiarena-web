import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
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

export default async function LatestReleases({ columns = 2, random = false, header = "LATEST RELEASES" }: {
  columns?: number;
  random?: boolean;
  header?: string;
}) {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const magsPath = process.env.MAGS_PATH ?? path.join(process.cwd(), "mags");
  const appsPath = process.env.APPS_PATH ?? path.join(process.cwd(), "apps");

  const orderClause = random
    ? Prisma.raw("ORDER BY RAND()")
    : Prisma.raw("ORDER BY a.fyear DESC, a.fmonth DESC, a.fday DESC");

  const rows = await prisma.$queryRaw<ReleaseRow[]>(Prisma.sql`
    SELECT * FROM (
      SELECT 'C' AS type, filename,
        year AS fyear, month AS fmonth, day AS fday
      FROM collys
      LIMIT 20
    ) a
    ${orderClause}
    LIMIT 20
  `);

  const releases: { url: string; content: string }[] = [];

  for (const row of rows) {
    if (releases.length >= columns) break;
    const filename = String(row.filename);
    const dirname = filename.split(".")[0];
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

    const content = readDiz(dizPath);
    if (content) releases.push({ url, content });
  }

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
                <a href={url} className="ascii magenta" dangerouslySetInnerHTML={{ __html: content }} />
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
