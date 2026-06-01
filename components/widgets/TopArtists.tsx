import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import LiveRefresh from "@/components/widgets/LiveRefresh";

const getTopArtists = unstable_cache(
  async (limit: number) => prisma.artists.findMany({
    where: { rating: { gt: 0 } },
    orderBy: { rating: "desc" },
    take: limit,
    select: { id: true, nick: true, rating: true },
  }),
  ["top-artists-widget"],
  { revalidate: 60 },
);

export default async function TopArtists({ limit = 5 }: { limit?: number }) {
  try {
    const rows = await getTopArtists(limit);

    return (
      <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
        <LiveRefresh channel="site:votes" />
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">TOP {limit} ARTISTS</h2>
        </div>
        <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
          {rows.map((row) => {
            const nick = row.nick ?? "";
            const rating = Number(row.rating ?? 0).toFixed(1);
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
              >
                <Link prefetch={false} className="green text-truncate" href={`/artist/${urlsafe(nick)}`}>
                  {nick}
                </Link>
                <span className="text-truncate">{rating} PTS</span>
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