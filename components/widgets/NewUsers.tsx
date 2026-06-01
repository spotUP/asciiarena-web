import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import LiveRefresh from "@/components/widgets/LiveRefresh";

export default async function NewUsers() {
  try {
    const rows = await prisma.users.findMany({
      orderBy: { joined: "desc" },
      take: 5,
      select: { id: true, nick: true, joined: true },
    });

    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:users" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">NEW USERS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          {rows.map((row) => {
            const joinDate = row.joined
              ? new Date(Number(row.joined) * 1000).toISOString().substring(2, 10)
              : "";
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
              >
                <Link
                  prefetch={false}
                  className="yellow text-truncate"
                  href={`/member/${urlsafe(row.nick ?? "")}`}
                >
                  {row.nick}
                </Link>
                <span className="text-truncate">{joinDate}</span>
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
