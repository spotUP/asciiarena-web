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

      {/* Login modal — BS5 attributes, action posts to NextAuth credentials endpoint */}
      <div className="modal" id="login" tabIndex={-1} role="dialog" aria-hidden="true">
        <div className="modal-dialog animate__animated animate__backInLeft" role="document">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: "#444444" }}>
              <span className="modal-title">LOGiN</span>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body bg-primary">
              {!session?.user ? (
                <form action="/api/auth/callback/credentials" method="post" id="login-form">
                  <input type="hidden" name="csrfToken" value="" id="csrf-token" />
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-12 col-sm-6">
                        <div className="form-group">
                          <input type="text" className="form-control" name="login" id="login-nick" autoComplete="username" placeholder="Enter your handle" />
                        </div>
                        <div className="form-group">
                          <input type="password" name="password" id="login-password" className="form-control" autoComplete="current-password" placeholder="Prove it" />
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="form-group">
                          <div className="custom-control custom-switch lightgrey">
                            <input className="custom-control-input" type="checkbox" id="rememberme" name="rememberme" value="1" defaultChecked />
                            <label className="custom-control-label" htmlFor="rememberme">Remember me</label>
                          </div>
                        </div>
                        <a href="/register">Register</a> <span style={{ color: "#999999" }}>new account!</span><br /><br />
                        <a href="/reminder">Help!</a> <span style={{ color: "#999999" }}>forgot your password?</span>
                      </div>
                    </div>
                  </div>
                  <div id="login-results"></div>
                </form>
              ) : (
                <span>You&apos;re already logged in</span>
              )}
            </div>
            <div className="modal-footer bg-primary">
              <button type="button" className="btn-secondary bg-transparent amr-1 apr-1" data-dismiss="modal">CLOSE</button>
              <button type="button" className="btn-primary black bg-lightgrey" id="login-submit-btn">LOG IN</button>
            </div>
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

          // Login form: POST to NextAuth credentials, reload on success
          function loginUser() {
            var nick = $("#login-nick").val();
            var pass = $("#login-password").val();
            $.ajax({
              type: "POST",
              url: "/api/auth/callback/credentials",
              data: { login: nick, password: pass, redirect: "false" },
              success: function() { window.location.reload(); },
              error: function() {
                $("#login-results").html('<div class="alert alert-danger animate__animated animate__shakeX">authentication failed</div>');
                setTimeout(function(){ $("#login-results").empty(); }, 3000);
              }
            });
          }
          $("#login-submit-btn").on("click", loginUser);
          $("#login-nick, #login-password").on("keyup", function(e) {
            if (e.which === 13) loginUser();
          });
          $("#login").on("shown.bs.modal", function() { $("#login-nick").focus(); });
        });
      `}</Script>
    </>
  );
}
