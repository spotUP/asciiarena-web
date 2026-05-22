import Link from "next/link";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import Script from "next/script";
import { unstable_cache } from "next/cache";

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
  { revalidate: 60 }
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
            {rows.map((row) => {
              const utc = new Date(row.timestamp * 1000).toISOString();
              const fallbackTime = new Date(row.timestamp * 1000)
                .toISOString()
                .substring(11, 16);
              return (
                <div
                  key={row.id}
                  className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
                >
                  <Link
                    className="yellow text-truncate"
                    href={`/member/${urlsafe(row.nick)}`}
                  >
                    {row.nick}
                  </Link>
                  <span className="lastcall-time text-truncate" data-utc={utc}>
                    {fallbackTime}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <Script id="lastcallers-localtime" strategy="afterInteractive">{`
          (function() {
            document.querySelectorAll(".lastcall-time").forEach(function(el) {
              var utc = el.getAttribute("data-utc");
              if (!utc) return;
              var d = new Date(utc);
              var h = ("0" + d.getHours()).slice(-2);
              var m = ("0" + d.getMinutes()).slice(-2);
              el.textContent = h + ":" + m;
            });
          })();
        `}</Script>
      </>
    );
  } catch {
    return null;
  }

}