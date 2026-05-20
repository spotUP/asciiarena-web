import Script from "next/script";
import type { Session } from "next-auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Navbar from "./Navbar";
import LogoHeader from "./LogoHeader";
import PageHeader from "./PageHeader";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export type SiteLayoutProps = {
  title?: string | string[];
  children: React.ReactNode;
};

export default async function SiteLayout({ title, children }: SiteLayoutProps) {
  const [rawSession, logoRows] = await Promise.all([
    auth(),
    prisma.$queryRaw<Array<{ ascii: string }>>(
      Prisma.sql`SELECT ascii FROM logos ORDER BY RAND() LIMIT 10`
    ),
  ]);

  // auth() is overloaded; cast to the Session | null variant
  const session = rawSession as Session | null;
  const logos = logoRows.map((r) => r.ascii);

  // Show CRT scanlines unless the user has explicitly disabled them
  const showCrt =
    !session?.user ||
    (session.user as { crt_effect?: string }).crt_effect !== "N";

  return (
    <>
      <div id="spotclose" className="spotclose" suppressHydrationWarning>
        <div className="noevents">x</div>
      </div>
      <Script id="fullscreen-toggle" strategy="beforeInteractive">{`
        function showFullscreen() {
          document.getElementById('colly')?.classList.toggle('fullscreen');
          document.getElementById('blacker')?.classList.toggle('show');
          document.getElementById('spotclose')?.classList.toggle('show');
        }
        document.addEventListener('DOMContentLoaded', function() {
          var el = document.getElementById('spotclose');
          if (el) el.onclick = showFullscreen;
        });
      `}</Script>

      {showCrt && <div className="scanlines"></div>}
      <div className="vignette"></div>

      <Navbar session={session} />

      <div className="container-fluid mobile-bg">
        <div className="row" style={{ paddingTop: "58px", paddingBottom: "16px" }}>
          <div className="col-12 d-flex align-items-center justify-content-center m-0 p-0">
            <LogoHeader logos={logos} />
          </div>
        </div>

        {title && <PageHeader title={title} />}

        <div className="modal-body row m-0 p-0">
          <div className="col-lg-8 order-md-1 order-lg-2 order-xl-2">
            {children}
          </div>
          <div className="col-lg-2 order-md-2 order-lg-1 order-xl-1">
            <LeftSidebar />
          </div>
          <div className="col-lg-2 order-md-3 order-lg-3 order-xl-3">
            <RightSidebar />
          </div>
        </div>
      </div>

      <Script id="switcharoo-init" strategy="afterInteractive">{`
        window.switchers = window.switchers || [];
        function switcharoo(selector, delay, idx, start) {
          if (typeof idx === "undefined") idx = window.switchers.length;
          if (typeof start === "undefined") start = 1;
          window.switchers[idx] = [start, selector, delay || 3000];
          window.switchers[idx][3] = setInterval(function() {
            $(selector+":nth-child("+window.switchers[idx][0]+")").fadeOut(300, function() {
              $(selector).css("display","none");
              if (window.switchers[idx][0] === $(selector).length) { window.switchers[idx][0]=1; }
              else { window.switchers[idx][0]++; }
              $(selector+":nth-child("+window.switchers[idx][0]+")").fadeIn(300);
            });
          }, window.switchers[idx][2]);
        }
        document.addEventListener("visibilitychange", function() {
          if (document.visibilityState === "visible") {
            window.switchers.forEach(function(s, idx) {
              var elements = $(s[1]).length;
              var start = 1;
              if (elements === 2 && s[0] !== 1) start = 2;
              else if (elements !== s[0]) start = s[0]+1;
              switcharoo(s[1], s[2], idx, start);
            });
          } else {
            window.switchers.forEach(function(s) { clearInterval(s[3]); });
          }
        });
        $(function() {
          $(".select2").select2();
          $(document).keydown(function(e){
            if(e.keyCode == 27) {
              $("#colly").toggleClass("fullscreen");
              $("#blacker").toggleClass("show");
              $("#spotclose").toggleClass("show");
            }
          });
        });
      `}</Script>
    </>
  );
}
