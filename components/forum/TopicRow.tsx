import Link from "next/link";
import RelativeTime from "@/components/widgets/RelativeTime";
import type { TopicView } from "@/lib/forum/types";

// One row in a board's topic list. The column widths match ForumSortHeaders.
export default function TopicRow({ topic, boardSlug }: { topic: TopicView; boardSlug: string }) {
  const replies = Math.max(0, topic.postCount - 1);
  return (
    <div className="row amb-1 m-0" style={{ height: "16px", lineHeight: "16px" }}>
      <div className="col-1 p-0">
        {topic.pinned ? <span className="yellow">*</span> : <span className="lightgrey">-</span>}
      </div>
      <div className="col-5 p-0 text-truncate">
        {topic.locked && <span className="lightred">{"[LOCKED] "}</span>}
        {topic.deletedAt != null && <span className="lightred">{"[DELETED] "}</span>}
        <Link prefetch={false} href={`/forum/${boardSlug}/${topic.slug}`} className="magenta">
          {topic.title}
        </Link>
      </div>
      <div className="col-2 p-0 lightgrey">
        {replies} {replies === 1 ? "reply" : "replies"}
      </div>
      <div className="col-2 p-0 text-truncate">
        <Link prefetch={false} href={`/member/${topic.authorNick ?? ""}`} className="yellow">
          {topic.authorNick ?? "unknown"}
        </Link>
      </div>
      <div className="col-2 p-0">
        <RelativeTime unix={topic.lastPostAt} className="lightgrey" />
      </div>
    </div>
  );
}
