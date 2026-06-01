import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe, formatBytes } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import LiveRefresh from "@/components/widgets/LiveRefresh";

const getTopUploaders = unstable_cache(
  async (limit: number) => prisma.users.findMany({
      where: { uploaded: { gt: 0 } },
      orderBy: { uploaded: "desc" },
      take: limit,
      select: { id: true, nick: true, uploaded: true },
    }),
  ["top-uploaders"],
  { revalidate: 600, tags: ["site:top-uploaders"] }
);

export default async function TopUploaders({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getTopUploaders(limit);
  
    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:releases" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">TOP UPLOADERS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          {rows.map((row) => {
            const nick = row.nick ?? "";
            const kb = formatBytes(row.uploaded ?? 0);
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
              >
                <Link prefetch={false} href={`/member/${urlsafe(nick)}`} className="text-truncate">
                  {nick}
                </Link>
                <span className="text-truncate">{kb}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch {
    return null;
  }

}