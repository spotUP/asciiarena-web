import SiteLayout from "@/components/layout/SiteLayout";
import CollysClient from "./CollysClient";

export default async function CollysPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const { sort_by = "name", sort_order = "A" } = await searchParams;
  return (
    <SiteLayout title="COLLYS">
      <CollysClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
