import Link from "next/link";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";

const getMostViewed = unstable_cache(
  async (limit: number) => prisma.collys.findMany({
      orderBy: { view_counter: "desc" },
      take: limit,
      select: { id: true, filename: true, view_counter: true },
    }),
  ["most-viewed-collys"],
  { revalidate: 311, tags: ["site:most-viewed"] }
);

export default async function MostViewedCollys({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getMostViewed(limit);
  
    return (
      <div className="widget">
        <LiveRefresh channel="site:releases" />
        <LiveRefresh channel="site:votes" />
        <div className="widget-head">
          <h2 className="widget-title bg-header">MOST VIEWED COLLYS</h2>
        </div>
        <div className="widget-body bg-secondary">
          <PrintLines>
          {rows.map((row) => {
            const filename = row.filename ?? "";
            const truncated =
              filename.length > 12 ? filename.substring(0, 12) : filename;
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
              >
                <Link prefetch={false} className="magenta text-truncate" href={`/release/${filename}`}>
                  {truncated}
                </Link>
                <span className="text-truncate">{row.view_counter}</span>
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