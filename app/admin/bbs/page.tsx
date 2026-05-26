import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import BbsClient from "./BbsClient";

export default function AdminBbsPage() {
  return (
    <SiteLayout title="ADMiN - BBS">
      <AdminNav />
      <BbsClient />
    </SiteLayout>
  );
}
