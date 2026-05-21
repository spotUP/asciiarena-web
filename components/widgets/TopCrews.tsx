import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";

export default async function TopCrews({ limit = 5 }: { limit?: number }) {
  const rows = await prisma.crews.findMany({
    orderBy: { rating: "desc" },
    take: limit,
    select: { id: true, name: true, rating: true },
  });

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">TOP {limit} CREWS</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => {
          const name = row.name ?? "";
          const rating = Number(row.rating ?? 0).toFixed(2);
          return (
            <div
              key={row.id}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <Link className="text-truncate" href={`/crew/${urlsafe(name)}/`}>
                {name}
              </Link>
              <span className="text-truncate">{rating} PTS</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
