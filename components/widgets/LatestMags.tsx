import Link from "next/link";
import { prisma } from "@/lib/db";

export type LatestMagsProps = {
  limit?: number;
};

export default async function LatestMags({ limit = 5 }: LatestMagsProps) {
  const rows = await prisma.mags.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: { id: true, filename: true, timestamp: true },
  });

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header text-truncate lightgreen">
          <Link className="lightgreen" href="/mags?sort_by=timestamp&sort_order=D">
            LATEST ADDED MAGS
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
              <Link className="magenta text-truncate" href={`/magazine/${filename}`}>
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
