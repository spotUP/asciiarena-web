import { requireMember } from "@/lib/routeGuards";

// Guards the 404 status, which the page cannot: this segment has a loading.tsx,
// so by the time the page runs the response has already started streaming and
// notFound() can no longer set a status code. See lib/routeGuards.ts.
export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ nick: string }>;
}) {
  const { nick } = await params;
  await requireMember(nick);
  return <>{children}</>;
}
