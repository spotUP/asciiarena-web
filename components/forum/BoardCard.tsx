import Link from "next/link";
import RelativeTime from "@/components/widgets/RelativeTime";
import type { BoardView } from "@/lib/forum/types";

const ROW = { height: "16px", lineHeight: "16px" } as const;

// One board on the index. Three 16px rows inside the standard panel:
// name + counts, description, last-post line.
export default function BoardCard({ board }: { board: BoardView }) {
  return (
    <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
      <div className="col-lg-12 p-0 d-flex" style={{ ...ROW, gap: "16px" }}>
        <span className="lightgrey" style={{ minWidth: "16px" }}>
          {board.locked ? "-" : ">"}
        </span>
        <Link prefetch={false} href={`/forum/${board.slug}`} className="magenta" style={{ minWidth: "320px" }}>
          {board.name}
        </Link>
        <span className="lightgrey" style={{ minWidth: "128px" }}>
          {board.topicCount} {board.topicCount === 1 ? "topic" : "topics"}
        </span>
        <span className="lightgrey" style={{ minWidth: "128px" }}>
          {board.postCount} {board.postCount === 1 ? "post" : "posts"}
        </span>
        {board.locked && <span className="lightred">[CLOSED]</span>}
        {board.hidden && <span className="yellow">[HIDDEN]</span>}
      </div>

      {board.description && (
        <div className="lightgrey col-lg-12 p-0 text-truncate" style={{ ...ROW, paddingLeft: "32px" }}>
          {board.description}
        </div>
      )}

      <div className="col-lg-12 p-0 d-flex" style={{ ...ROW, gap: "8px", paddingLeft: "32px" }}>
        <span className="lightgrey">Last:</span>
        {board.lastTopicSlug && board.lastTopicTitle ? (
          <>
            <Link
              prefetch={false}
              href={`/forum/${board.slug}/${board.lastTopicSlug}`}
              className="magenta text-truncate"
              style={{ maxWidth: "320px" }}
            >
              {board.lastTopicTitle}
            </Link>
            <span className="lightgrey">by</span>
            <span className="yellow">{board.lastUserNick ?? "unknown"}</span>
            {board.lastPostAt != null && <RelativeTime unix={board.lastPostAt} className="lightgrey" />}
          </>
        ) : (
          <span className="lightgrey">no posts yet</span>
        )}
      </div>
    </div>
  );
}
