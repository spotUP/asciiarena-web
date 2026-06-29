import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import PrintLines from "@/components/ui/PrintLines";
import LocalTime from "@/components/widgets/LocalTime";

export type LastCallersProps = {
  limit?: number;
};

const getLastCallers = unstable_cache(
  async (limit: number) => prisma.lastusers.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: { id: true, user_id: true, nick: true, timestamp: true },
  }),
  ["last-callers"],
  // Staggered off the other widgets' TTLs so the homepage's cached widgets
  // don't all revalidate in one burst every 60s (that synchronized stampede
  // caused intermittent ~3s render spikes).
  { revalidate: 71 }
);

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
                <LocalTime unix={row.timestamp} className="text-truncate" />
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