import { requireForumBoard } from "@/lib/routeGuards";

// Guards the 404 status, which the page cannot: this segment has a loading.tsx,
// so by the time the page runs the response has already started streaming and
// notFound() can no longer set a status code. See lib/routeGuards.ts.
//
// Covers the board's children too -- a topic or the new-topic form under a
// board that does not exist is equally not found.
export default async function ForumBoardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;
  await requireForumBoard(board);
  return <>{children}</>;
}
