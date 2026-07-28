import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import BoardNewItemsPill from "@/components/forum/BoardNewItemsPill";
import ForumStaticHeaders, {
  BOARD_COLUMNS,
  RECENT_TOPIC_COLUMNS,
} from "@/components/forum/ForumStaticHeaders";
import BoardRow from "@/components/forum/BoardRow";
import TopicRow from "@/components/forum/TopicRow";
import ForumSectionTitle from "@/components/forum/ForumSectionTitle";
import { getSession } from "@/lib/session";
import { listBoards, listRecentTopics } from "@/lib/forum/db";
import { canModerate, canPostInBoard } from "@/lib/forum/rules";
import { prisma } from "@/lib/db";
import type { ForumViewer } from "@/lib/forum/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Forum | aSCIIaRENA" };

/** Long enough to show the week's activity, short enough to stay above the fold. */
const RECENT_TOPIC_LIMIT = 10;

export default async function ForumIndexPage() {
  const session = await getSession();
  const viewer: ForumViewer = {
    userId: session?.user?.id ? Number(session.user.id) : null,
    rank: session?.user?.rank ?? null,
  };

  const boards = await listBoards(viewer);
  // What is being talked about, not only where to talk. Both lists come from
  // the same permission filter, so a private board never surfaces here.
  const recentTopics = await listRecentTopics(viewer, RECENT_TOPIC_LIMIT);
  const isModerator = canModerate(viewer);
  // Reports the moderator has not dealt with. Shown on the button so a full
  // queue is visible from the forum rather than only from /admin.
  const openReports = isModerator
    ? await prisma.forum_reports.count({ where: { resolved_at: null } })
    : 0;
  // The button only makes sense if there is somewhere to post.
  const postable = boards.find(b => canPostInBoard(b, viewer));

  return (
    <SiteLayout title={["FORUM", "tALK sHOP"]}>
      {/* A pill, not a LiveRefresh: every post anywhere on the forum lands on
          this channel, so auto-reloading meant the board index reloaded
          constantly while you were reading it. */}
      <BoardNewItemsPill channel="site:forum" />
      <ForumSectionTitle>BOARDS</ForumSectionTitle>

      <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
        <ForumStaticHeaders columns={BOARD_COLUMNS} />
        {boards.length === 0 ? (
          <div className="lightgrey" style={{ height: "16px", lineHeight: "16px" }}>
            No boards have been created yet.
          </div>
        ) : (
          boards.map((b, i) => (
            <BoardRow
              key={b.id}
              board={b}
              moderation={
                isModerator
                  ? {
                      index: i,
                      prevBoard: i > 0 ? { id: boards[i - 1].id, index: i - 1 } : null,
                      nextBoard: i < boards.length - 1 ? { id: boards[i + 1].id, index: i + 1 } : null,
                    }
                  : undefined
              }
            />
          ))
        )}
      </div>

      {recentTopics.length > 0 && (
        <>
          <ForumSectionTitle>RECENT TOPICS</ForumSectionTitle>
          <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
            <ForumStaticHeaders columns={RECENT_TOPIC_COLUMNS} />
            {recentTopics.map(t => (
              <TopicRow key={t.id} topic={t} boardSlug={t.boardSlug} boardName={t.boardName} />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {postable && (
          <Link prefetch={false} href={`/forum/${postable.slug}/new`}>
            <input type="button" className="btn-big" value="NEW TOPIC" />
          </Link>
        )}
        {isModerator && (
          <>
            <Link prefetch={false} href="/admin/forum/new">
              <input type="button" className="btn-big" value="NEW BOARD" />
            </Link>
            <Link prefetch={false} href="/admin/forum/reports">
              <input
                type="button"
                className="btn-big"
                value={openReports > 0 ? `REPORTS (${openReports})` : "REPORTS"}
              />
            </Link>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
