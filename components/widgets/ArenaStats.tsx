import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import LiveRefresh from "@/components/widgets/LiveRefresh";

const getArenaStats = unstable_cache(
  async () => {
    const [collysCount, bytesResult, usersCount, commentsCount] = await Promise.all([
      prisma.collys.count(),
      prisma.$queryRaw<[{ bytes: bigint }]>(Prisma.sql`SELECT sum(filesize) as bytes FROM collys`),
      prisma.users.count(),
      prisma.comments.count(),
    ]);
    return { collysCount, bytes: Number(bytesResult[0]?.bytes ?? 0), usersCount, commentsCount };
  },
  ["arena-stats"],
  // Tag busted via revalidateTag() in the broadcast points (app/actions/collys.ts,
  // app/api/collys/route.ts, app/api/collys/[id]/comments/route.ts, app/api/register/route.ts)
  // so LiveRefresh below actually returns fresh numbers, not the 300s-stale cache.
  { revalidate: 300, tags: ["site:stats"] }
);

export default async function ArenaStats() {
  try {
    const { collysCount, bytes, usersCount, commentsCount } = await getArenaStats();
    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2" style={{ minHeight: "160px" }}>
        <LiveRefresh channel="site:releases" />
        <LiveRefresh channel="site:users" />
        <LiveRefresh channel="site:comments" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">aSCIIaRENA STATS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary" style={{ minHeight: "112px" }}>
          <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
            <span className="white text-truncate">Collys Online:</span>
            <span className="text-truncate">{collysCount}</span>
          </div>
          <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
            <span className="white text-truncate">Pumped Bytes:</span>
            <span className="text-truncate">{formatBytes(bytes)}</span>
          </div>
          <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
            <span className="white text-truncate">Users:</span>
            <span className="text-truncate">{usersCount}</span>
          </div>
          <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
            <span className="white text-truncate">Comments:</span>
            <span className="text-truncate">{commentsCount}</span>
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
