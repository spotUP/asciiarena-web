import { prisma } from "@/lib/db";
import SiteLayout from "@/components/layout/SiteLayout";

export const dynamic = "force-dynamic";

interface NewsRow {
  id: number;
  title: string;
  body: string;
  created_at: number;
  author: string | null;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

// The permanent home for site news. The announcement bar is deliberately
// transient — it shows once and then counts as read — so everything it ever
// showed has to be readable here afterwards.
export default async function NewsPage() {
  const rows = await prisma.$queryRaw<NewsRow[]>`
    SELECT n.id, n.title, n.body, n.created_at,
           (SELECT u.nick FROM users u WHERE u.id = n.created_by_id) AS author
    FROM news n
    WHERE n.published = 1
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT 100
  `;

  return (
    <SiteLayout title="sITE nEWS">
      {rows.length === 0 && (
        <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
          <span className="lightgrey">No news yet.</span>
        </div>
      )}
      {rows.map(row => (
        <div key={row.id} className="container-fluid m-0 p-0" style={{ marginBottom: "16px" }}>
          <div className="header bg-header col-12 ap-1 d-flex" style={{ gap: "16px" }}>
            <span className="yellow" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.title}
            </span>
            <span className="lightgrey" style={{ flexShrink: 0 }}>{formatDate(row.created_at)}</span>
          </div>
          <div className="bg-secondary col-12 ap-1">
            <div
              className="lightgrey"
              style={{ whiteSpace: "pre-wrap", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}
            >
              {row.body}
            </div>
            {row.author && (
              <div className="lightgrey" style={{ marginTop: "16px" }}>-- {row.author}</div>
            )}
          </div>
        </div>
      ))}
    </SiteLayout>
  );
}
