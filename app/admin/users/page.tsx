import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import UsersClient from "./UsersClient";

export default function AdminUsersPage() {
  return (
    <SiteLayout title="ADMiN - Users">
      <AdminNav />
      <UsersClient />
    </SiteLayout>
  );
}
