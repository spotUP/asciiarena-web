import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";

const getTopCrews = unstable_cache(
  async (limit: number) => prisma.crews.findMany({
    where: { rating: { gt: 0 } },
    orderBy: { rating: "desc" },
    take: limit,
    select: { id: true, name: true, rating: true },
  }),
  ["top-crews-widget"],
  { revalidate: 60 },
);

export default async function TopCrews({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getTopCrews(limit);

    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:votes" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">TOP {limit} CREWS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          <PrintLines>
          {rows.map((row) => {
            const name = row.name ?? "";
            const rating = Number(row.rating ?? 0).toFixed(1);
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
              >
                <Link prefetch={false} className="text-truncate" href={`/crew/${urlsafe(name)}/`}>
                  {name}
                </Link>
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