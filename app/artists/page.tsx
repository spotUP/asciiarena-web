import SiteLayout from "@/components/layout/SiteLayout";
import ArtistsClient from "./ArtistsClient";

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const { sort_by = "nick", sort_order = "A" } = await searchParams;
  return (
    <SiteLayout title="ARTISTS">
      <ArtistsClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
