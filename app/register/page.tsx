import SiteLayout from "@/components/layout/SiteLayout";
import RegisterForm from "./RegisterForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <SiteLayout title="REGiSTER">
      <RegisterForm />
    </SiteLayout>
  );
}
