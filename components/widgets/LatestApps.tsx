import Link from "next/link";
import { prisma } from "@/lib/db";

export type LatestAppsProps = {
  limit?: number;
};

export default async function LatestApps({ limit = 5 }: LatestAppsProps) {
  const rows = await prisma.apps.findMany({
    where: { Status: { not: "Illegal" } },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: { id: true, filename: true, timestamp: true },
  });

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header text-truncate lightgreen">
          <Link className="lightgreen" href="/apps?sort_by=timestamp&sort_order=D">
            LATEST ADDED APPS
          </Link>
        </h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => {
          const filename = row.filename ?? "";
          const truncated =
            filename.length > 12 ? filename.substring(0, 12) : filename;
          const uploadDate = row.timestamp
            ? new Date(row.timestamp * 1000)
                .toISOString()
                .substring(2, 10)
            : "";
          return (
            <div
              key={row.id}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <Link className="magenta text-truncate" href={`/application/${filename}`}>
                {truncated}
              </Link>
              <span className="text-truncate">{uploadDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
