import Link from "next/link";
import { notFound } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import BoardNewItemsPill from "@/components/forum/BoardNewItemsPill";
import ForumBreadcrumb from "@/components/forum/ForumBreadcrumb";
import ForumPaginator from "@/components/forum/ForumPaginator";
import ForumSortHeaders from "@/components/forum/ForumSortHeaders";
import TopicRow from "@/components/forum/TopicRow";
import { getSession } from "@/lib/session";
import { getBoardBySlug, listTopics, type TopicSortKey } from "@/lib/forum/db";
import { canPostInBoard, canReadBoard } from "@/lib/forum/rules";
import { TOPICS_PER_PAGE, type ForumViewer } from "@/lib/forum/types";
import { normalizeOrder } from "@/lib/sort-headers";

export const dynamic = "force-dynamic";

const SORT_KEYS: TopicSortKey[] = ["title", "replies", "author", "last_post"];

interface PageProps {
  params: Promise<{ board: string }>;
  searchParams: Promise<{ page?: string; sort_by?: string; order?: string; filter?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { board } = await params;
  const b = await getBoardBySlug(board);
  return { title: b ? `${b.name} | aSCIIaRENA Forum` : "Forum | aSCIIaRENA" };
}

export default async function BoardPage({ params, searchParams }: PageProps) {
  const { board: boardSlug } = await params;
  const sp = await searchParams;

  const board = await getBoardBySlug(boardSlug);
  if (!board) notFound();

  const session = await getSession();
  const viewer: ForumViewer = {
    userId: session?.user?.id ? Number(session.user.id) : null,
    rank: session?.user?.rank ?? null,
  };

  // A board that exists but is not for you says so, rather than pretending to
  // be missing. A lying 404 makes people think the site is broken.
  if (!canReadBoard(board, viewer)) {
    return (
      <SiteLayout title={board.name.toUpperCase()}>
        <ForumBreadcrumb crumbs={[{ label: "FORUM", href: "/forum" }, { label: board.name }]} />
        <div className="container-fluid bg-secondary ap-1">
          <div className="lightred" style={{ height: "16px", lineHeight: "16px" }}>
            {viewer.userId == null
              ? "[!] This board is for logged in members only."
              : "[!] You do not have permission to view this board."}
          </div>
        </div>
      </SiteLayout>
    );
  }

  const sortBy = (SORT_KEYS as string[]).includes(sp.sort_by ?? "")
    ? (sp.sort_by as TopicSortKey)
    : "last_post";
  // Newest-first is the useful default for a forum, so an absent ?order= means
  // descending here rather than the helper's ascending.
  const order = sp.order ? normalizeOrder(sp.order) : "desc";
  const filter = sp.filter?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const { topics, total } = await listTopics(board.id, { page, sortBy, order, filter, viewer });
  const maxPage = Math.max(1, Math.ceil(total / TOPICS_PER_PAGE));
  const canPost = canPostInBoard(board, viewer);

  return (
    <SiteLayout title={board.name.toUpperCase()}>
      <ForumBreadcrumb crumbs={[{ label: "FORUM", href: "/forum" }, { label: board.name }]} />
      <BoardNewItemsPill channel={`forum:board:${board.id}`} />

      {board.description && (
        <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
          {board.description}
        </div>
      )}
      {board.locked && (
        <div className="lightred" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
          [!] This board is closed to new topics.
        </div>
      )}

      <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
        <ForumSortHeaders sortBy={sortBy} order={order} />
        {topics.length === 0 ? (
          <div className="lightgrey" style={{ height: "16px", lineHeight: "16px" }}>
            {filter
              ? `No topics match "${filter}". Clear the search to see them all.`
              : "No topics in this board yet. Be the first to post."}
          </div>
        ) : (
          topics.map(t => <TopicRow key={t.id} topic={t} boardSlug={board.slug} />)
        )}
      </div>

      <ForumPaginator
        page={page}
        maxPage={maxPage}
        basePath={`/forum/${board.slug}`}
        params={{ sort_by: sortBy, order }}
        filterValue={filter ?? ""}
      />

      {canPost && (
        <div style={{ marginTop: "16px" }}>
          <Link prefetch={false} href={`/forum/${board.slug}/new`}>
            <input type="button" className="btn-big" value="NEW TOPIC" />
          </Link>
        </div>
      )}
    </SiteLayout>
  );
}
