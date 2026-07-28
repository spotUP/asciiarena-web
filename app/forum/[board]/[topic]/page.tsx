import { notFound } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import ForumBreadcrumb from "@/components/forum/ForumBreadcrumb";
import ForumPaginator from "@/components/forum/ForumPaginator";
import PostItem from "@/components/forum/PostItem";
import ReplyComposer from "@/components/forum/ReplyComposer";
import TopicLive from "@/components/forum/TopicLive";
import TopicModeration from "@/components/forum/TopicModeration";
import { getSession } from "@/lib/session";
import { bumpViewCount, getBoardById, getTopic, listPosts } from "@/lib/forum/db";
import { canDeletePost, canEditPost, canModerate, canReadBoard, canReplyToTopic } from "@/lib/forum/rules";
import { parseTopicId } from "@/lib/forum/slug";
import { POSTS_PER_PAGE, type ForumViewer } from "@/lib/forum/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ board: string; topic: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { topic: topicSlug } = await params;
  const id = parseTopicId(topicSlug);
  const t = id ? await getTopic(id) : null;
  return { title: t ? `${t.title} | aSCIIaRENA Forum` : "Forum | aSCIIaRENA" };
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const { board: boardSlug, topic: topicSlug } = await params;
  const sp = await searchParams;

  // The id suffix is the identity; the words in front of it are decoration, so
  // an old or edited title still resolves.
  const topicId = parseTopicId(topicSlug);
  if (!topicId) notFound();

  const topic = await getTopic(topicId);
  if (!topic) notFound();
  const board = await getBoardById(topic.boardId);
  if (!board || board.slug !== boardSlug) notFound();

  const session = await getSession();
  const viewer: ForumViewer = {
    userId: session?.user?.id ? Number(session.user.id) : null,
    rank: session?.user?.rank ?? null,
  };

  if (!canReadBoard(board, viewer)) {
    return (
      <SiteLayout title={topic.title.toUpperCase()}>
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
  if (topic.deletedAt != null && !canModerate(viewer)) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const { posts, total, firstIndex } = await listPosts(topic.id, { page, viewer });
  const maxPage = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  await bumpViewCount(topic.id);

  const now = Math.floor(Date.now() / 1000);
  const canReply = canReplyToTopic(topic, board, viewer);
  const channel = `forum:topic:${topic.id}`;

  return (
    <SiteLayout title={topic.title.toUpperCase()}>
      <ForumBreadcrumb
        crumbs={[
          { label: "FORUM", href: "/forum" },
          { label: board.name, href: `/forum/${board.slug}` },
          { label: topic.title },
        ]}
      />

      {/* Rendered only when there is a badge: an always-present row costs 32px
          of empty space under the breadcrumb on every ordinary topic. */}
      {(topic.pinned || topic.locked || topic.deletedAt != null) && (
        <div className="d-flex" style={{ gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
          {topic.pinned && <span className="yellow">[PINNED]</span>}
          {topic.locked && <span className="lightred">[LOCKED]</span>}
          {topic.deletedAt != null && <span className="lightred">[DELETED]</span>}
        </div>
      )}

      {canModerate(viewer) && (
        <TopicModeration
          topicId={topic.id}
          boardSlug={board.slug}
          pinned={topic.pinned}
          locked={topic.locked}
        />
      )}

      {/* The page's one live connection: viewer count, typing drafts, replies. */}
      <TopicLive channel={channel} userNick={session?.user?.name ?? null} onLastPage={page >= maxPage} />

      {posts.length === 0 ? (
        <div className="container-fluid bg-secondary ap-1 lightgrey" style={{ marginBottom: "16px" }}>
          No replies yet.
        </div>
      ) : (
        posts.map((p, i) => (
          <PostItem
            key={p.id}
            post={p}
            seq={firstIndex + i}
            canEdit={canEditPost(p, viewer, now)}
            canDelete={canDeletePost(p, viewer)}
            canReport={viewer.userId != null && viewer.userId !== p.userId && p.deletedAt == null}
          />
        ))
      )}

      {/* A "1 of 1" pager on a topic that fits one page is pure furniture. */}
      {maxPage > 1 && (
        <ForumPaginator page={page} maxPage={maxPage} basePath={`/forum/${board.slug}/${topic.slug}`} />
      )}

      {canReply ? (
        <ReplyComposer topicId={topic.id} />
      ) : (
        <div className="container-fluid bg-secondary ap-1" style={{ marginTop: "16px" }}>
          <div className="lightred" style={{ height: "16px", lineHeight: "16px" }}>
            {viewer.userId == null ? (
              <>
                [!] You must be logged in to reply.{" "}
                {/* The login modal lives in SiteLayout on every page, so this
                    needs no navigation and loses no scroll position. */}
                <a className="magenta" data-bs-toggle="modal" href="#login">
                  LOG IN
                </a>
              </>
            ) : topic.locked ? (
              "[!] This topic is locked. New replies are turned off."
            ) : (
              "[!] You do not have permission to post in this board yet."
            )}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
