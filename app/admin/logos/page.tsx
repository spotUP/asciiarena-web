import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import LogosClient from "./LogosClient";

export default function AdminLogosPage() {
  return (
    <SiteLayout title="ADMiN - Logos">
      <AdminNav />
      <LogosClient />
    </SiteLayout>
  );
}
