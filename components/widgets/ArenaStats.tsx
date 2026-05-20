import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function ArenaStats() {
  const [collysCount, bytesResult, usersCount, commentsCount] = await Promise.all([
    prisma.collys.count(),
    prisma.$queryRaw<[{ bytes: bigint }]>(
      Prisma.sql`SELECT sum(filesize) as bytes FROM collys`
    ),
    prisma.users.count(),
    prisma.comments.count(),
  ]);

  const bytes = Number(bytesResult[0]?.bytes ?? 0);

  return (
    <div className="container-fluid col-12 p-0" style={{ minHeight: "160px" }}>
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">aSCIIaRENA STATS</h2>
      </div>
      <div
        className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary"
        style={{ minHeight: "112px" }}
      >
        <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
          <span className="white text-truncate">Collys Online:</span>
          <span className="text-truncate">{collysCount}</span>
        </div>
        <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
          <span className="white text-truncate">Pumped Bytes:</span>
          <span className="text-truncate">{formatBytes(bytes)}</span>
        </div>
        <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
          <span className="white text-truncate">Users:</span>
          <span className="text-truncate">{usersCount}</span>
        </div>
        <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
          <span className="white text-truncate">Comments:</span>
          <span className="text-truncate">{commentsCount}</span>
        </div>
      </div>
    </div>
  );
}
