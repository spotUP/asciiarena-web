import Link from "next/link";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";

export type LatestMagsProps = {
  limit?: number;
};

const getLatestMags = unstable_cache(
  async (limit: number) => prisma.mags.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: { id: true, filename: true, timestamp: true },
  }),
  ["latest-mags"],
  { revalidate: 163, tags: ["site:latest-mags"] }
);

export default async function LatestMags({ limit = 5 }: LatestMagsProps) {
  try {
    const rows = await getLatestMags(limit);

    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:mags" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header text-truncate lightgreen">
            <Link prefetch={false} className="lightgreen" href="/mags?sort_by=timestamp&sort_order=D">LATEST ADDED MAGS</Link>
          </h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          <PrintLines>
          {rows.map((row) => {
            const filename = row.filename ?? "";
            const truncated = filename.length > 12 ? filename.substring(0, 12) : filename;
            const uploadDate = row.timestamp
              ? new Date(row.timestamp * 1000).toISOString().substring(2, 10)
              : "";
            return (
              <div key={row.id} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
                <Link prefetch={false} className="magenta text-truncate" href={`/magazine/${filename}`}>{truncated}</Link>
                <span className="text-truncate">{uploadDate}</span>
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
