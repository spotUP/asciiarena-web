import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";

type TopColly = { filename: string; rating: number };

const getTopCollys = unstable_cache(
  async (limit: number) => prisma.$queryRaw<TopColly[]>(Prisma.sql`
    SELECT c.filename, c.rating
    FROM collys c
    INNER JOIN (
      SELECT colly_id FROM comments WHERE rating > 0
      GROUP BY colly_id HAVING COUNT(*) > 2
    ) v ON v.colly_id = c.id
    ORDER BY c.rating DESC
    LIMIT ${limit}
  `),
  ["top-collys-widget"],
  { revalidate: 127 }, // staggered to avoid the synchronized 60s revalidation stampede
);

export default async function TopCollys({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getTopCollys(limit);
    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:votes" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">TOP {limit} COLLYS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          <PrintLines>
          {rows.map((row) => {
            const filename = row.filename ?? "";
            const rating = Number(row.rating).toFixed(1);
            return (
              <div key={filename} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
                <Link prefetch={false} className="magenta text-truncate" href={`/release/${filename}`}>{filename}</Link>
                <span className="text-truncate">{rating} PTS</span>
              </div>
            );
          })}
          </PrintLines>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
