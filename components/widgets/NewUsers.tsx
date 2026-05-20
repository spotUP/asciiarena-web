import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";

export default async function NewUsers() {
  const rows = await prisma.users.findMany({
    orderBy: { joined: "desc" },
    take: 5,
    select: { id: true, nick: true, joined: true },
  });

  return (
    <div className="container fluid col-12 p-0 ps-lg-2 pe-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">NEW USERS</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {rows.map((row) => {
          const joinDate =
            typeof row.joined === "number"
              ? new Date(row.joined * 1000).toISOString().substring(2, 10)
              : row.joined
              ? String(row.joined).substring(0, 8)
              : "";
          return (
            <div
              key={row.id}
              className="col-lg-12 p-0 ps-lg-2 pe-lg-2 d-flex justify-content-between"
            >
              <a
                className="yellow text-truncate"
                href={`/member/${urlsafe(row.nick ?? "")}`}
              >
                {row.nick}
              </a>
              <span className="text-truncate">{joinDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
