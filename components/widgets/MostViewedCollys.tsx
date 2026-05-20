import { prisma } from "@/lib/db";

export default async function MostViewedCollys({ limit = 5 }: { limit?: number }) {
  const rows = await prisma.collys.findMany({
    orderBy: { view_counter: "desc" },
    take: limit,
    select: { id: true, filename: true, view_counter: true },
  });

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">MOST VIEWED COLLYS</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => {
          const filename = row.filename ?? "";
          const truncated =
            filename.length > 12 ? filename.substring(0, 12) : filename;
          return (
            <div
              key={row.id}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <a className="magenta text-truncate" href={`/release/${filename}`}>
                {truncated}
              </a>
              <span className="text-truncate">{row.view_counter}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
