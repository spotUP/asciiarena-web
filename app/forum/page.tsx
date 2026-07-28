import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import BoardNewItemsPill from "@/components/forum/BoardNewItemsPill";
import BoardHeaders from "@/components/forum/BoardHeaders";
import BoardRow from "@/components/forum/BoardRow";
import ForumSectionTitle from "@/components/forum/ForumSectionTitle";
import { getSession } from "@/lib/session";
import { listBoards } from "@/lib/forum/db";
import { canPostInBoard } from "@/lib/forum/rules";
import type { ForumViewer } from "@/lib/forum/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Forum | aSCIIaRENA" };

export default async function ForumIndexPage() {
  const session = await getSession();
  const viewer: ForumViewer = {
    userId: session?.user?.id ? Number(session.user.id) : null,
    rank: session?.user?.rank ?? null,
  };

  const boards = await listBoards(viewer);
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
        <BoardHeaders />
        {boards.length === 0 ? (
          <div className="lightgrey" style={{ height: "16px", lineHeight: "16px" }}>
            No boards have been created yet.
          </div>
        ) : (
          boards.map(b => <BoardRow key={b.id} board={b} />)
        )}
      </div>

      {postable && (
        <div style={{ marginTop: "16px" }}>
          <Link prefetch={false} href={`/forum/${postable.slug}/new`}>
            <input type="button" className="btn-big" value="NEW TOPIC" />
          </Link>
        </div>
      )}
    </SiteLayout>
  );
}
