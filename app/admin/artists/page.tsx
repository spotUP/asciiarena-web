import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import ArtistsClient from "./ArtistsClient";

export default function AdminArtistsPage() {
  return (
    <SiteLayout title="ADMiN - Artists">
      <AdminNav />
      <ArtistsClient />
    </SiteLayout>
  );
}
