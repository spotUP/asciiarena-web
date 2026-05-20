import SiteLayout from "@/components/layout/SiteLayout";
import BBSClient from "./BBSClient";

export default async function BBSPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const { sort_by = "name", sort_order = "A" } = await searchParams;
  return (
    <SiteLayout title="BBS">
      <BBSClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
