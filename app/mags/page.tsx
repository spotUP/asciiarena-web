import SiteLayout from "@/components/layout/SiteLayout";
import MagsClient from "./MagsClient";

export default async function MagsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const { sort_by = "name", sort_order = "A" } = await searchParams;
  return (
    <SiteLayout title="MAGS">
      <MagsClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
