import { prisma } from "@/lib/db";
import { urlsafe, formatBytes } from "@/lib/utils";

export default async function TopUploaders() {
  const rows = await prisma.users.findMany({
    where: { uploaded: { gt: 0 } },
    orderBy: { uploaded: "desc" },
    take: 5,
    select: { id: true, nick: true, uploaded: true },
  });

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">TOP UPLOADERS</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => {
          const nick = row.nick ?? "";
          const kb = formatBytes(row.uploaded ?? 0);
          return (
            <div
              key={row.id}
              className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between"
            >
              <a href={`/member/${urlsafe(nick)}`} className="text-truncate">
                {nick}
              </a>
              <span className="text-truncate">{kb}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
