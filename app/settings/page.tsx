import SiteLayout from "@/components/layout/SiteLayout";
import SettingsForm from "./SettingsForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <SiteLayout title="SETTiNGS">
      <SettingsForm />
    </SiteLayout>
  );
}
