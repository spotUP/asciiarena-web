import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SiteLayout from "@/components/layout/SiteLayout";
import Script from "next/script";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    const { callbackUrl } = await searchParams;
    const dest = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";
    redirect(dest);
  }

  return (
    <SiteLayout title="LOGiN">
      <div className="col-lg-12 apt-1 text-center">
        <p>Please log in to continue.</p>
      </div>
      <Script id="open-login-modal" strategy="afterInteractive">{`
        new bootstrap.Modal(document.getElementById('login')).show();
      `}</Script>
    </SiteLayout>
  );
}
