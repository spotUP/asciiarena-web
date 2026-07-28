import { notFound, redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import ForumBreadcrumb from "@/components/forum/ForumBreadcrumb";
import NewTopicForm from "@/components/forum/NewTopicForm";
import { getSession } from "@/lib/session";
import { getBoardBySlug } from "@/lib/forum/db";
import { canPostInBoard, canReadBoard } from "@/lib/forum/rules";
import type { ForumViewer } from "@/lib/forum/types";

export const dynamic = "force-dynamic";

export default async function NewTopicPage({ params }: { params: Promise<{ board: string }> }) {
  const { board: boardSlug } = await params;
  const board = await getBoardBySlug(boardSlug);
  if (!board) notFound();

  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/forum/${boardSlug}/new`)}`);
  }
  const viewer: ForumViewer = { userId: Number(session.user.id), rank: session.user.rank ?? null };

  const crumbs = [
    { label: "FORUM", href: "/forum" },
    { label: board.name, href: `/forum/${board.slug}` },
    { label: "New topic" },
  ];

  if (!canPostInBoard(board, viewer)) {
    return (
      <SiteLayout title="NEW TOPIC">
        <ForumBreadcrumb crumbs={crumbs} />
        <div className="container-fluid bg-secondary ap-1">
          <div className="lightred" style={{ height: "16px", lineHeight: "16px" }}>
            {!canReadBoard(board, viewer)
              ? "[!] You do not have permission to view this board."
              : board.locked
                ? "[!] This board is closed to new topics."
                : "[!] You do not have permission to post in this board yet."}
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout title="NEW TOPIC">
      <ForumBreadcrumb crumbs={crumbs} />
      <NewTopicForm boardSlug={board.slug} boardName={board.name} />
    </SiteLayout>
  );
}
