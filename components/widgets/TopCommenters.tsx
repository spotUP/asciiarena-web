import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { unstable_cache } from "next/cache";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";

type TopCommenter = { topcommentators: number; nick: string; user_id: number };

const getTopCommenters = unstable_cache(
  async (limit: number) => {
    const rows = await prisma.$queryRaw<{ topcommentators: bigint; nick: string; user_id: number }[]>(
      Prisma.sql`
        SELECT COUNT(user_id) AS topcommentators, nick, user_id
        FROM comments
        GROUP BY user_id, nick
        ORDER BY topcommentators DESC
        LIMIT ${limit}
      `
    );
    return rows.map(r => ({ ...r, topcommentators: Number(r.topcommentators) }));
  },
  ["top-commenters"],
  { revalidate: 600, tags: ["site:top-commenters"] }
);

export default async function TopCommenters({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getTopCommenters(limit);
  
    return (
      <div className="widget">
        <LiveRefresh channel="site:comments" />
        <div className="widget-head">
          <h2 className="widget-title bg-header">TOP COMMENTERS</h2>
        </div>
        <div className="widget-body bg-secondary">
          <PrintLines>
          {rows.map((row) => (
            <div
              key={row.user_id}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <Link prefetch={false} className="yellow text-truncate" href={`/member/${urlsafe(row.nick)}`}>
                {row.nick}
              </Link>
              <span className="text-truncate">{Number(row.topcommentators)}</span>
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