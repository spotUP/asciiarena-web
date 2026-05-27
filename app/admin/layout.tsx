import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/session";
import SiteLayout from "@/components/layout/SiteLayout";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") redirect("/");
  return (
    <SiteLayout title="ADMiN">
      <AdminNav />
      {children}
    </SiteLayout>
  );
}
