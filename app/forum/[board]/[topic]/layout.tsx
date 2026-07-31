import { requireForumTopic } from "@/lib/routeGuards";

// Guards the 404 status, which the page cannot: this segment inherits the
// forum's loading.tsx, so by the time the page runs the response has already
// started streaming and notFound() can no longer set a status code. See
// lib/routeGuards.ts.
//
// Only existence is checked here. Whether a DELETED topic is visible depends on
// the viewer's rank, and that decision stays in the page.
export default async function ForumTopicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ board: string; topic: string }>;
}) {
  const { board, topic } = await params;
  await requireForumTopic(board, topic);
  return <>{children}</>;
}
