import { requireRequest } from "@/lib/routeGuards";

// Guards the 404 status, which the page cannot: this segment inherits
// app/requests/loading.tsx, so by the time the page runs the response has
// already started streaming and notFound() can no longer set a status code.
// See lib/routeGuards.ts.
export default async function RequestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRequest(id);
  return <>{children}</>;
}
