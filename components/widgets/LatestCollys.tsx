import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PrintLines from "@/components/ui/PrintLines";

export type LatestCollysProps = {
  type: "released" | "added";
  limit?: number;
};

function padPart(val: number | null | undefined, fallback: string): string {
  if (val == null || val === 0) return fallback;
  return String(val).padStart(2, "0");
}

const getLatestCollys = unstable_cache(
  async (type: "released" | "added", limit: number) =>
    type === "released"
      ? prisma.collys.findMany({
          orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { timestamp: "desc" }],
          take: limit,
          select: { id: true, filename: true, year: true, month: true, day: true, timestamp: true },
        })
      : prisma.collys.findMany({
          orderBy: { timestamp: "desc" },
          take: limit,
          select: { id: true, filename: true, year: true, month: true, day: true, timestamp: true },
        }),
  ["latest-collys-widget"],
  { revalidate: 83 }, // staggered to avoid the synchronized 60s revalidation stampede
);

export default async function LatestCollys({ type, limit = 8 }: LatestCollysProps) {
  try {
    const collys = await getLatestCollys(type, limit);

    const isReleased = type === "released";
    const headerClass = isReleased
      ? "widget-title bg-header text-truncate yellow"
      : "widget-title bg-header text-truncate lightgreen";
    const headerHref = isReleased
      ? "/collys?sort_by=cdate&sort_order=D"
      : "/collys?sort_by=timestamp&sort_order=D";
    const headerText = isReleased ? "NEW COLLYS" : "LATEST ADDED COLLYS";

    return (
      <div className="widget">
        <LiveRefresh channel="site:releases" />
        <div className="widget-head">
          <h2 className={headerClass}>
            <Link prefetch={false} href={headerHref} className={isReleased ? undefined : "lightgreen"}>{headerText}</Link>
          </h2>
        </div>
        <div className="widget-body bg-secondary">
          <PrintLines>
          {collys.map((row) => {
            const filename = row.filename ?? "";
            const truncated = filename.length > 12 ? filename.substring(0, 12) : filename;

            if (isReleased) {
              const yr = row.year ? String(row.year).slice(-2) : "xx";
              const mo = padPart(row.month, "xx");
              const dy = padPart(row.day, "xx");
              return (
                <div key={row.id} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
                  <span><Link prefetch={false} className="magenta text-truncate" href={`/release/${filename}`}>{truncated}</Link></span>
                  <span className="text-truncate">{yr}-{mo}-{dy}</span>
                </div>
              );
            } else {
              const uploadDate = row.timestamp
                ? new Date(row.timestamp * 1000).toISOString().substring(2, 10)
                : "";
              return (
                <div key={row.id} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
                  <Link prefetch={false} className="magenta text-truncate" href={`/release/${filename}`}>{truncated}</Link>
                  <span className="text-truncate">{uploadDate}</span>
                </div>
              );
            }
          })}
          </PrintLines>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
