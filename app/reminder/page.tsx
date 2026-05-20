import SiteLayout from "@/components/layout/SiteLayout";
import ReminderForm from "./ReminderForm";

export default async function ReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
  return (
    <SiteLayout title="pASSWORD rECOVERY">
      <ReminderForm resetToken={reset} />
    </SiteLayout>
  );
}
