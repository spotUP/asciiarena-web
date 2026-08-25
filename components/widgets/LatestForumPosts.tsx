import Link from "next/link";
import { getSession } from "@/lib/session";
import { listRecentPosts } from "@/lib/forum/db";
import type { ForumViewer } from "@/lib/forum/types";

function formatDate(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(5, 10);
}

/**
 * Compact sidebar list of the newest forum replies. Without it nothing outside
 * /forum hints the forum is alive.
 *
 * Deliberately NOT wrapped in LiveRefresh: it re-renders on any router.refresh()
 * the tab already performs, so it costs no SSE connection on every page of the
 * site. Also does not copy LatestNews's fontSize: 0.85em, which contradicts the
 * uniform-16px rule.
 *
 * Returns null when empty. Hideable renders the [X] before its child, and only
 * the :has() rule in site.css stops a stray [X] floating in the gap -- an
 * "empty" wrapper div would defeat it.
 */
export default async function LatestForumPosts({ limit = 5 }: { limit?: number }) {
  const session = await getSession();
  const viewer: ForumViewer = {
    userId: session?.user?.id ? Number(session.user.id) : null,
    rank: session?.user?.rank ?? null,
  };

  const posts = await listRecentPosts(viewer, limit);
  if (posts.length === 0) return null;

  return (
    <div className="widget">
      <div className="widget-head">
        <h2 className="widget-title bg-header">FORUM</h2>
      </div>
      <div className="widget-body bg-secondary">
        {posts.map(p => (
          <div
            key={p.id}
            className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex"
            style={{ gap: "8px", height: "16px", lineHeight: "16px" }}
          >
            <span className="lightgrey" style={{ flexShrink: 0 }}>{formatDate(p.createdAt)}</span>
            <Link
              prefetch={false}
              href={`/forum/${p.boardSlug}/${p.topicSlug}#p${p.id}`}
              className="lightcyan"
              style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "clip", whiteSpace: "nowrap" }}
              title={`${p.topicTitle} - ${p.authorNick ?? "unknown"}`}
            >
              {p.topicTitle}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
