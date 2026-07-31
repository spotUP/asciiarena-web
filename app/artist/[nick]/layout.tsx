import { requireArtist } from "@/lib/routeGuards";

// Guards the 404 status, which the page cannot: this segment has a loading.tsx,
// so by the time the page runs the response has already started streaming and
// notFound() can no longer set a status code. See lib/routeGuards.ts.
export default async function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ nick: string }>;
}) {
  const { nick } = await params;
  await requireArtist(nick);
  return <>{children}</>;
}
