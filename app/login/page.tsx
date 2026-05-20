import SiteLayout from "@/components/layout/SiteLayout";
import Script from "next/script";

export default function LoginPage() {
  return (
    <SiteLayout title="LOGiN">
      <div className="col-lg-12 apt-1 text-center">
        <p>Please log in to continue.</p>
      </div>
      <Script id="open-login-modal" strategy="afterInteractive">{`
        $(function() {
          var modal = new bootstrap.Modal(document.getElementById('login'));
          modal.show();
        });
      `}</Script>
    </SiteLayout>
  );
}
