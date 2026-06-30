import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import CollyTester from "./CollyTester";

export default async function CollyTestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <SiteLayout title="COLLY TESTER">
      <CollyTester />
    </SiteLayout>
  );
}
