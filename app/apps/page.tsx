import SiteLayout from "@/components/layout/SiteLayout";
import AppsClient from "./AppsClient";

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const { sort_by = "name", sort_order = "A" } = await searchParams;
  return (
    <SiteLayout title="APPS">
      <AppsClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
