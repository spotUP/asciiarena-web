import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { urlsafe } from "@/lib/utils";

interface CommentRow {
  filename: string;
  nick: string;
  comment: string;
}

export default async function LatestComments() {
  const rows = await prisma.$queryRaw<CommentRow[]>(Prisma.sql`
    SELECT filename, nick,
      CASE WHEN LENGTH(comment) = 0
        THEN CONCAT(nick, ' voted ', rating)
        ELSE comment
      END AS comment
    FROM comments
    ORDER BY timestamp DESC
    LIMIT 10
  `);

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header w-100 col-12">
        <h2 className="ap-1 am-0 bg-header">LATEST COMMENTS</h2>
      </div>
      <div className="col-12 bg-secondary apb-1">
        <div className="row">
          <div className="col-6 col-sm-7 text-truncate apb-1 apt-1">
            <span className="white">COMMENT</span>
          </div>
          <div className="col-sm-3 text-truncate d-none d-sm-block apt-1">
            <span className="white">COLLY</span>
          </div>
          <div className="col-6 col-sm-2 text-truncate apt-1">
            <span className="white float-right">NiCK</span>
          </div>
        </div>
        {rows.map((row, i) => (
          <div className="row" key={i}>
            <div className="col-sm-7 cyan text-truncate">
              <a className="cyan" href={`/release/${row.filename}`}>{row.comment}</a>
            </div>
            <div className="col-6 col-sm-3 mb-4 mb-sm-0 text-truncate">
              <a className="magenta text-truncate" href={`/release/${row.filename}`}>{row.filename}</a>
            </div>
            <div className="col-6 col-sm-2 mb-4 mb-sm-0 text-truncate">
              <a className="yellow text-truncate float-right" href={`/member/${urlsafe(row.nick)}`}>{row.nick}</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
