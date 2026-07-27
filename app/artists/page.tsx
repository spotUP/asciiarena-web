import Link from "next/link";
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
      {/* The country column is clickable per row; this is the way in for
          "which countries had the most artists" without hunting for one. */}
      <div style={{ height: "16px", lineHeight: "16px", marginBottom: "8px" }}>
        <Link href="/countries" className="lightgrey" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
          {"[ browse artists by country -> ]"}
        </Link>
      </div>
      <ArtistsClient initialSort={sort_by} initialOrder={sort_order} />
    </SiteLayout>
  );
}
