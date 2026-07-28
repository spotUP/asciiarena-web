import Link from "next/link";
import AnsiPost from "@/components/forum/AnsiPost";
import PostActions from "@/components/forum/PostActions";
import { shouldRenderBodyText } from "@/lib/forum/rules";
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
  canReport: boolean;
}

export default function PostItem({ post, seq, canEdit, canDelete, canReport }: Props) {
  // A deleted post keeps its row so a moderated thread does not develop
  // unexplained gaps in its numbering, but its content is stripped -- which
  // left an empty row that read as a post that had refused to delete. Dimming
  // the whole line to the site's disabled grey makes it read as what it is.
  // Only moderators ever get here: everyone else is filtered out in listPosts.
  const deleted = post.deletedAt != null;
  const nickClass = deleted ? "grey" : "yellow";
  const metaClass = deleted ? "grey" : "lightgrey";

  return (
    // Black, not the usual grey panel: an ANSI post is black-backed art, and a
    // grey frame around it read as a box the art was sitting in rather than as
    // the post itself. Posts stay separated by the header line and the gap
    // between them.
    <div id={`p${post.id}`} className="col-lg-12 pl-0 apb-1 bg-black ap-1" style={{ marginBottom: "16px" }}>
      <div className="d-flex justify-content-between" style={{ height: "16px", lineHeight: "16px" }}>
        <span>
          <span className={metaClass}>#{seq}</span>{" "}
          <Link prefetch={false} href={`/member/${post.authorNick ?? ""}`} className={nickClass}>
            {post.authorNick ?? "unknown"}
          </Link>
          {deleted && <span className="grey">{" [DELETED]"}</span>}
        </span>
        <span className={metaClass}>{stamp(post.createdAt)}</span>
      </div>

      {post.deletedAt != null && (
        // Without this the row is a bare header over empty space. Say plainly
        // that the content is gone, and when it went.
        <div className="grey" style={{ height: "16px", lineHeight: "16px", marginTop: "16px" }}>
          {`post deleted ${stamp(post.deletedAt)}`}
        </div>
      )}

      {post.ansiB64 && (
        <div style={{ marginTop: "16px" }}>
          <AnsiPost ansiB64={post.ansiB64} font={post.ansiFont} />
        </div>
      )}
      {shouldRenderBodyText(post) && (
        // Only when there is no art. A post drawn in the editor stores the
        // canvas text in `body` as well, so rendering both showed every post
        // twice -- once in colour, once as raw text underneath.
        //
        // softDeletePost only stamps deleted_at, it does not clear the content,
        // so a deleted post still has its text here. Moderators keep seeing
        // what was removed, but it reads as removed rather than as live.
        <div
          className={deleted ? "grey" : undefined}
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "16px" }}
        >
          {post.body}
        </div>
      )}

      {post.editedAt != null && (
        <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginTop: "16px" }}>
          {`[edited ${post.editCount === 1 ? "once" : `${post.editCount} times`}]`}
        </div>
      )}

      <PostActions postId={post.id} body={post.body} canEdit={canEdit} canDelete={canDelete} canReport={canReport} />
    </div>
  );
}
