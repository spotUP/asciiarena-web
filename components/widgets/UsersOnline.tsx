import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function UsersOnline() {
  const nowUnix = Math.floor(Date.now() / 1000);
  const cutoff = nowUnix - 300;

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

  const anonymousOnline = Number(anonymousResult[0]?.online ?? 0);

  return (
    <div className="container fluid col-12 p-0 ps-lg-2 pe-lg-2" style={{ minHeight: "160px" }}>
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">USERS ONLINE</h2>
      </div>
      <div
        className="container col-12 p-0 m-0 apt-1 bg-secondary"
        style={{ minHeight: "112px" }}
      >
        {activeUsers.map((row) => (
          <div key={row.id} className="col-lg-12">
            <a className="yellow" href={`/member/${urlsafe(row.nick ?? "")}`}>
              {row.nick}
            </a>
          </div>
        ))}
        <div className="col-lg-12 apt-1 p-0 ps-lg-2 pe-lg-2">
          <span>{anonymousOnline} anonymous online</span>
        </div>
      </div>
    </div>
  );
}
