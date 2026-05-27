import SiteLayout from "@/components/layout/SiteLayout";
import SettingsForm from "./SettingsForm";
import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import { getInitialSettings } from "@/app/actions/settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const initialSettings = await getInitialSettings();
  return (
    <SiteLayout title="SETTiNGS">
      <SettingsForm initialSettings={initialSettings} />
    </SiteLayout>
  );
}
