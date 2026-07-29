import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminForumList() {
  const boards = await prisma.forum_boards.findMany({ orderBy: [{ sort_order: "asc" }, { id: "asc" }] });

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">FORUM</h2>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <Link prefetch={false} href="/admin/forum/new" style={{
          display: "inline-block", height: "32px", lineHeight: "32px", padding: "0 16px",
          background: "#212121", color: "#ffff55", border: "1px solid #555",
          fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", textDecoration: "none",
        }}>+ NEW BOARD</Link>
        <Link prefetch={false} href="/admin/forum/reports" className="magenta" style={{ marginLeft: "16px" }}>
          [ REPORTS ]
        </Link>
      </div>
      <div className="container-fluid bg-secondary apb-1 ap-1">
        {boards.length === 0 && <div style={{ color: "#aaaaaa" }}>No boards yet.</div>}
        {boards.map(b => (
          <div key={b.id} className="col-lg-12 p-0 d-flex" style={{ gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "8px" }}>
            <span style={{ minWidth: "16px", color: "#5e5d5e" }}>{b.sort_order}</span>
            <Link prefetch={false} className="magenta" href={`/admin/forum/${b.id}`} style={{ minWidth: "256px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {b.name}
            </Link>
            <span className="lightgrey" style={{ minWidth: "144px" }}>
              {b.min_read_rank ? `read: ${b.min_read_rank}` : "read: everyone"}
            </span>
            <span className="lightgrey" style={{ minWidth: "160px" }}>post: {b.min_post_rank}</span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{b.topic_count} topics</span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{b.post_count} posts</span>
            {b.locked && <span className="lightred">[CLOSED]</span>}
            {b.hidden && <span className="yellow">[HIDDEN]</span>}
          </div>
        ))}
      </div>
    </>
  );
}
