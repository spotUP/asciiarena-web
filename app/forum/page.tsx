import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import BoardCard from "@/components/forum/BoardCard";
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
      {/* Board counters and last-post lines only; nothing to lose on refresh. */}
      <LiveRefresh channel="site:forum" />
      <ForumSectionTitle>BOARDS</ForumSectionTitle>

      {boards.length === 0 ? (
        <div className="container-fluid bg-secondary ap-1 lightgrey" style={{ marginBottom: "16px" }}>
          No boards have been created yet.
        </div>
      ) : (
        boards.map(b => <BoardCard key={b.id} board={b} />)
      )}

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
