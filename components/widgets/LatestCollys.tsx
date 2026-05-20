import { prisma } from "@/lib/db";

export type LatestCollysProps = {
  type: "released" | "added";
  limit?: number;
};

function padPart(val: number | null | undefined, fallback: string): string {
  if (val == null || val === 0) return fallback;
  return String(val).padStart(2, "0");
}

export default async function LatestCollys({ type, limit = 8 }: LatestCollysProps) {
  const collys =
    type === "released"
      ? await prisma.collys.findMany({
          orderBy: [
            { year: "desc" },
            { month: "desc" },
            { day: "desc" },
            { timestamp: "desc" },
          ],
          take: limit,
          select: {
            id: true,
            filename: true,
            year: true,
            month: true,
            day: true,
            timestamp: true,
          },
        })
      : await prisma.collys.findMany({
          orderBy: { timestamp: "desc" },
          take: limit,
          select: {
            id: true,
            filename: true,
            year: true,
            month: true,
            day: true,
            timestamp: true,
          },
        });

  const isReleased = type === "released";

  const headerClass = isReleased
    ? "ap-1 bg-header text-truncate yellow"
    : "ap-1 bg-header text-truncate lightgreen";

  const headerHref = isReleased
    ? "/collys?sort_by=cdate&sort_order=D"
    : "/collys?sort_by=timestamp&sort_order=D";

  const headerText = isReleased ? "NEW COLLYS" : "LATEST ADDED COLLYS";
  const headerLinkClass = isReleased ? undefined : "lightgreen";

  return (
    <div className="container fluid col-12 p-0 ps-lg-2 pe-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className={headerClass}>
          <a href={headerHref} className={headerLinkClass ?? undefined}>
            {headerText}
          </a>
        </h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {collys.map((row) => {
          const filename = row.filename ?? "";
          const truncated =
            filename.length > 12 ? filename.substring(0, 12) : filename;

          if (isReleased) {
            const yr = row.year ? String(row.year).slice(-2) : "xx";
            const mo = padPart(row.month, "xx");
            const dy = padPart(row.day, "xx");
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 ps-lg-2 pe-lg-2 d-flex justify-content-between"
              >
                <span>
                  <a className="magenta text-truncate" href={`/release/${filename}`}>
                    {truncated}
                  </a>
                </span>
                <span className="text-truncate">
                  {yr}-{mo}-{dy}
                </span>
              </div>
            );
          } else {
            const uploadDate = row.timestamp
              ? new Date(row.timestamp * 1000)
                  .toISOString()
                  .substring(2, 10)
                  .replace(/-/g, "-")
              : "";
            return (
              <div
                key={row.id}
                className="col-lg-12 p-0 ps-lg-2 pe-lg-2 d-flex justify-content-between"
              >
                <a className="magenta text-truncate" href={`/release/${filename}`}>
                  {truncated}
                </a>
                <span className="text-truncate">{uploadDate}</span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
