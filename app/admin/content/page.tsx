import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import ContentClient from "./ContentClient";

export default function AdminContentPage() {
  return (
    <SiteLayout title="ADMiN - Apps & Mags">
      <AdminNav />
      <ContentClient />
    </SiteLayout>
  );
}
