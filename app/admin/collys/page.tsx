import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import CollysClient from "./CollysClient";

export default function AdminCollysPage() {
  return (
    <SiteLayout title="ADMiN - Collys">
      <AdminNav />
      <CollysClient />
    </SiteLayout>
  );
}
