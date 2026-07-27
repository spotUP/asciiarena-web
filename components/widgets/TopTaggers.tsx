import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";
import { buildTopTaggersQuery } from "@/lib/topTaggersQuery";

type TopTaggerRow = { user_id: number; nick: string; logos: bigint | number; collys: bigint | number };

const getTopTaggers = unstable_cache(
  async (limit: number) => {
    const rows = await prisma.$queryRaw<TopTaggerRow[]>(buildTopTaggersQuery(limit));
    return rows.map((r) => ({
      user_id: Number(r.user_id),
      nick: r.nick,
      logos: Number(r.logos),
      collys: Number(r.collys),
    }));
  },
  ["top-taggers"],
  { revalidate: 600, tags: ["site:top-taggers"] },
);

export default async function TopTaggers({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getTopTaggers(limit);
    // Nothing tagged yet: show nothing rather than an empty box. The widget
    // appears on its own once the first logo is mapped.
    if (!rows.length) return null;

    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:logos" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">TOP TAGGERS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          <PrintLines>
            {rows.map((row) => (
              <div
                key={row.user_id}
                className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
              >
                <Link prefetch={false} className="yellow text-truncate" href={`/member/${urlsafe(row.nick)}`}>
                  {row.nick}
                </Link>
                <span className="text-truncate" title={`${row.logos} logos across ${row.collys} coll${row.collys === 1 ? "y" : "ys"}`}>
                  {row.logos}
                </span>
              </div>
            ))}
          </PrintLines>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
