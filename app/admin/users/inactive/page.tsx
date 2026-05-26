import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import InactiveClient from "./InactiveClient";

export default function InactiveUsersPage() {
  return (
    <SiteLayout title="ADMiN - Inactive Users">
      <AdminNav />
      <InactiveClient />
    </SiteLayout>
  );
}
