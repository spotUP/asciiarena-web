import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

type TopCommenter = { topcommentators: bigint; nick: string; user_id: number };

export default async function TopCommenters({ limit = 5 }: { limit?: number }) {
  const rows = await prisma.$queryRaw<TopCommenter[]>(
    Prisma.sql`
      SELECT COUNT(user_id) AS topcommentators, nick, user_id
      FROM comments
      GROUP BY user_id, nick
      ORDER BY topcommentators DESC
      LIMIT ${limit}
    `
  );

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">TOP COMMENTERS</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => (
          <div
            key={row.user_id}
            className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
          >
            <Link className="yellow text-truncate" href={`/member/${urlsafe(row.nick)}`}>
              {row.nick}
            </Link>
            <span className="text-truncate">{Number(row.topcommentators)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
