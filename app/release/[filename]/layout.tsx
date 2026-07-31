import { requireColly } from "@/lib/routeGuards";

// Guards the 404 status, which the page cannot: this segment has a loading.tsx,
// so by the time the page runs the response has already started streaming and
// notFound() can no longer set a status code. See lib/routeGuards.ts.
export default async function ReleaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ filename: string }>;
}) {
  const { filename } = await params;
  await requireColly(filename);
  return <>{children}</>;
}
