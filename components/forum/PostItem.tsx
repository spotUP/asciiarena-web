import Link from "next/link";
import AnsiPost from "@/components/forum/AnsiPost";
import PostActions from "@/components/forum/PostActions";
import type { PostView } from "@/lib/forum/types";

function stamp(unix: number): string {
  // Absolute time on a post, not relative: a thread is read in order, and
  // "2h" on every line tells you nothing about the gaps between them.
  const d = new Date(unix * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

interface Props {
  post: PostView;
  seq: number;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PostItem({ post, seq, canEdit, canDelete }: Props) {
  return (
    <div id={`p${post.id}`} className="col-lg-12 pl-0 apb-1 bg-secondary ap-1" style={{ marginBottom: "16px" }}>
      <div className="d-flex justify-content-between" style={{ height: "16px", lineHeight: "16px" }}>
        <span>
          <span className="lightgrey">#{seq}</span>{" "}
          <Link prefetch={false} href={`/member/${post.authorNick ?? ""}`} className="yellow">
            {post.authorNick ?? "unknown"}
          </Link>
          {post.deletedAt != null && <span className="lightred">{" [DELETED]"}</span>}
        </span>
        <span className="lightgrey">{stamp(post.createdAt)}</span>
      </div>

      {post.ansiB64 && (
        <div style={{ marginTop: "16px" }}>
          <AnsiPost ansiB64={post.ansiB64} font={post.ansiFont} />
        </div>
      )}
      {post.body && (
        // An ANSI post may still carry a text caption, so this is not an
        // either/or with the art above it.
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "16px" }}>{post.body}</div>
      )}

      {post.editedAt != null && (
        <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginTop: "16px" }}>
          {`[edited ${post.editCount === 1 ? "once" : `${post.editCount} times`}]`}
        </div>
      )}

      <PostActions postId={post.id} body={post.body} canEdit={canEdit} canDelete={canDelete} />
    </div>
  );
}
