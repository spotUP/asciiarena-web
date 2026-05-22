import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { urlsafe } from "@/lib/utils";
import { unstable_cache } from "next/cache";

interface CommentRow {
  filename: string;
  nick: string;
  comment: string;
}

const getLatestComments = unstable_cache(
  async () => prisma.$queryRaw<CommentRow[]>(Prisma.sql`
    SELECT
      COALESCE(c.filename, co.filename) AS filename,
      COALESCE(c.nick, u.nick, 'unknown') AS nick,
      CASE WHEN CHAR_LENGTH(c.comment) = 0
        THEN CONCAT(COALESCE(c.nick, u.nick, 'unknown'), ' voted ', c.rating)
        ELSE c.comment
      END AS comment
    FROM comments c
    LEFT JOIN collys co ON co.id = c.colly_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE COALESCE(c.filename, co.filename) IS NOT NULL
    ORDER BY c.timestamp DESC
    LIMIT 10
  `),
  ["latest-comments"],
  { revalidate: 60 }
);

export default async function LatestComments() {
  try {
    const rows = await getLatestComments();

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
  } catch {
    return null;
  }
}
