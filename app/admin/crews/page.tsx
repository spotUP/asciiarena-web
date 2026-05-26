import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";
import CrewsClient from "./CrewsClient";

export default function AdminCrewsPage() {
  return (
    <SiteLayout title="ADMiN - Crews">
      <AdminNav />
      <CrewsClient />
    </SiteLayout>
  );
}
