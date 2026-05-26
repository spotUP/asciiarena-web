import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import RequestsClient from "./RequestsClient";

export default function AdminRequestsPage() {
  return (
    <SiteLayout title="ADMiN - Requests">
      <AdminNav />
      <RequestsClient />
    </SiteLayout>
  );
}
