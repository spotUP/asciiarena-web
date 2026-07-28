import Link from "next/link";
import BoardModeration from "@/components/forum/BoardModeration";
import RelativeTime from "@/components/widgets/RelativeTime";
import type { BoardView } from "@/lib/forum/types";

const ROW = { height: "16px", lineHeight: "16px" } as const;

/**
 * One board on the index, as a row in the same table the topic list uses.
 *
 * It used to be a panel per board -- name, description and last-post each on
 * their own line, in their own box -- which read as a stack of cards rather
 * than a list you can scan down. The columns here line up with BoardHeaders,
 * the way TopicRow lines up with ForumSortHeaders.
 *
 * The description keeps its own 16px line under the name rather than being
 * dropped: it is the only thing telling a reader what a board is for.
 */
interface Props {
  board: BoardView;
  /**
   * Board management shown inline for moderators. Undefined for everyone else,
   * so the row renders exactly as before for a normal reader.
   */
  moderation?: {
    index: number;
    prevBoard: { id: number; index: number } | null;
    nextBoard: { id: number; index: number } | null;
  };
}

export default function BoardRow({ board, moderation }: Props) {
  return (
    <div className="amb-1">
      <div className="row m-0" style={ROW}>
        <div className="col-1 p-0">
          <span className="lightgrey">{board.locked ? "-" : ">"}</span>
        </div>
        <div className="col-5 p-0 text-truncate">
          <Link prefetch={false} href={`/forum/${board.slug}`} className="magenta">
            {board.name}
          </Link>
          {board.locked && <span className="lightred">{" [CLOSED]"}</span>}
          {board.hidden && <span className="yellow">{" [HIDDEN]"}</span>}
        </div>
        <div className="col-2 p-0 lightgrey">
          {board.topicCount} {board.topicCount === 1 ? "topic" : "topics"}
        </div>
        <div className="col-2 p-0 lightgrey">
          {board.postCount} {board.postCount === 1 ? "post" : "posts"}
        </div>
        <div className="col-2 p-0 text-truncate">
          {board.lastTopicSlug && board.lastTopicTitle ? (
            <>
              <Link
                prefetch={false}
                href={`/forum/${board.slug}/${board.lastTopicSlug}`}
                className="magenta"
              >
                {board.lastTopicTitle}
              </Link>{" "}
              {board.lastPostAt != null && <RelativeTime unix={board.lastPostAt} className="lightgrey" />}
            </>
          ) : (
            <span className="lightgrey">no posts yet</span>
          )}
        </div>
      </div>

      {board.description && (
        <div className="row m-0" style={ROW}>
          <div className="col-1 p-0" />
          <div className="col-11 p-0 lightgrey text-truncate">{board.description}</div>
        </div>
      )}

      {moderation && (
        <div className="row m-0" style={ROW}>
          <div className="col-1 p-0" />
          <div className="col-11 p-0">
            <BoardModeration
              boardId={board.id}
              locked={board.locked}
              hidden={board.hidden}
              index={moderation.index}
              prevBoard={moderation.prevBoard}
              nextBoard={moderation.nextBoard}
            />
          </div>
        </div>
      )}
    </div>
  );
}
