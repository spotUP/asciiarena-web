import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import PrintLines from "@/components/ui/PrintLines";
import RelativeTime from "@/components/widgets/RelativeTime";

export type LastCallersProps = {
  limit?: number;
};

// Not cached: it must reflect a fresh login immediately (a 71s cache made it
// look stale right after logging in). It's a single indexed ORDER BY ... LIMIT 5
// query, so running it per render is cheap — unlike the heavier widgets whose
// caches exist to avoid a synchronized revalidation stampede.
async function getLastCallers(limit: number) {
  return prisma.lastusers.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: { id: true, user_id: true, nick: true, timestamp: true },
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
                  href={`/member/${urlsafe(row.nick)}`}
                >
                  {row.nick}
                </Link>
                <RelativeTime unix={row.timestamp} className="text-truncate" />
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