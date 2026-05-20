import SiteLayout from "@/components/layout/SiteLayout";
import RequestsClient from "./RequestsClient";

export default function RequestsPage() {
  return (
    <SiteLayout title="REQUESTS">
      <RequestsClient />
    </SiteLayout>
  );
}
