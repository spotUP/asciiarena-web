import { notFound } from "next/navigation";
import { getSession as auth } from "@/lib/session";
import SiteLayout from "@/components/layout/SiteLayout";
import PlaylistsClient from "./PlaylistsClient";

export default async function PlaylistsPage() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") notFound();

  return (
    <SiteLayout title="HiPPO pLAYLiSTS">
      <PlaylistsClient />
    </SiteLayout>
  );
}
