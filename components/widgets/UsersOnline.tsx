import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import PrintLines from "@/components/ui/PrintLines";

const getUsersOnline = unstable_cache(
  async () => {
    const cutoff = Math.floor(Date.now() / 1000) - 300;
    const [activeUsers, anonymousResult] = await Promise.all([
      prisma.users.findMany({
        where: { lastactive: { gt: cutoff } },
        orderBy: { lastactive: "desc" },
        select: { id: true, nick: true, lastactive: true },
      }),
      prisma.$queryRaw<[{ online: bigint }]>(
        Prisma.sql`SELECT COUNT(DISTINCT(session)) as online FROM users_online`
      ),
    ]);
    return { activeUsers, anonymousOnline: Number(anonymousResult[0]?.online ?? 0) };
  },
  ["users-online"],
  { revalidate: 30 }
);

export default async function UsersOnline() {
  try {
    const { activeUsers, anonymousOnline } = await getUsersOnline();
    return (
      <div className="widget">
        <div className="widget-head">
          <h2 className="widget-title bg-header">USERS ONLINE</h2>
        </div>
        <div className="widget-body bg-secondary" style={{ minHeight: "112px" }}>
          <PrintLines>
          {activeUsers.map((row) => (
            <div key={row.id} className="col-lg-12">
              <a className="yellow" href={`/member/${urlsafe(row.nick ?? "")}`}>{row.nick}</a>
            </div>
          ))}
          </PrintLines>
          <div className="col-lg-12 apt-1 p-0 pl-lg-2 pr-lg-2">
            <span>{anonymousOnline} anonymous online</span>
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
