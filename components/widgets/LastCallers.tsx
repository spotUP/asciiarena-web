import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import PrintLines from "@/components/ui/PrintLines";
import RelativeTime from "@/components/widgets/RelativeTime";

export type LastCallersProps = {
  limit?: number;
};

// Recently-ACTIVE users (users.lastactive, stamped by the heartbeat ping), not
// just fresh logins — a user on a persistent session who's browsing/chatting
// should appear too. One row per user (no login dupes). Not cached: cheap indexed
// ORDER BY ... LIMIT, and it must feel live.
async function getLastCallers(limit: number) {
  return prisma.users.findMany({
    where: { lastactive: { gt: 0 } },
    orderBy: { lastactive: "desc" },
    take: limit,
    select: { id: true, nick: true, lastactive: true },
  });
}

export default async function LastCallers({ limit = 5 }: LastCallersProps) {
  try {
    const rows = await getLastCallers(limit);
  
    return (
      <>
        <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
          <div className="header col-lg-12 p-0">
            <h2 className="ap-1 bg-header">LAST CALLERS</h2>
          </div>
          <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
            <PrintLines>
            {rows.map((row) => (
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
                <RelativeTime unix={row.lastactive ?? 0} className="text-truncate" />
              </div>
            ))}
            </PrintLines>
          </div>
        </div>
      </>
    );
  } catch {
    return null;
  }

}