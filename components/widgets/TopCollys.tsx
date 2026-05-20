import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

type TopColly = { filename: string; rating: number };

export default async function TopCollys() {
  const rows = await prisma.$queryRaw<TopColly[]>(
    Prisma.sql`
      SELECT filename, rating
      FROM collys
      WHERE filename IN (
        SELECT filename FROM comments GROUP BY filename HAVING COUNT(commentid) > 3
      )
      ORDER BY rating DESC
      LIMIT 5
    `
  );

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">TOP 5 COLLYS</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => {
          const filename = row.filename ?? "";
          const rating = Number(row.rating).toFixed(2);
          return (
            <div
              key={filename}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <a className="magenta text-truncate" href={`/release/${filename}`}>
                {filename}
              </a>
              <span className="text-truncate">{rating} PTS</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
