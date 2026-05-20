import SiteLayout from "@/components/layout/SiteLayout";
import CrewsClient from "./CrewsClient";

export default async function CrewsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const { sort_by = "name", sort_order = "A" } = await searchParams;
  return (
    <SiteLayout title="CREWS">
      <CrewsClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
