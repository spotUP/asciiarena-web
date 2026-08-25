import ContentLink from "@/components/ui/ContentLink";
import { prisma } from "@/lib/db";

interface NewsRow { id: number; title: string; created_at: number }

function formatDate(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(5, 10);
}

// Compact sidebar list of recent news, so an announcement missed during its
// few seconds on the bar is still one click away. Returns null when there is
// no news rather than rendering an empty box.
export default async function LatestNews({ limit = 5 }: { limit?: number }) {
  const rows = await prisma.$queryRaw<NewsRow[]>`
    SELECT id, title, created_at FROM news
    WHERE published = 1
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit}
  `;
  if (rows.length === 0) return null;

  return (
    <div className="widget">
      <div className="widget-head">
        <h2 className="widget-title bg-header">NEWS</h2>
      </div>
      <div className="widget-body bg-secondary">
        {rows.map(row => (
          <div
            key={row.id}
            className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex"
            style={{ gap: "8px", fontSize: "0.85em", paddingBottom: "3px" }}
          >
            <span className="lightgrey" style={{ flexShrink: 0 }}>{formatDate(row.created_at)}</span>
            <ContentLink
              href="/news"
              className="lightcyan"
              style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={row.title}
            >
              {row.title}
            </ContentLink>
          </div>
        ))}
      </div>
    </div>
  );
}
